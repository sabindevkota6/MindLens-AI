"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// get all dashboard stats for the counselor home page
export const getCounselorDashboardStats = async () => {
    const session = await auth();
    if (!session?.user || session.user.role !== "COUNSELOR") return null;

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, fullName: true, hourlyRate: true },
    });
    if (!profile) return null;

    const now = new Date();

    // run all queries in parallel for performance
    const [
        appointmentCounts,
        totalReviewStats,
        uniquePatients,
        upcomingAppointments,
        recentReviews,
        ratingDistribution,
        monthlyAppointments,
        todayAppointments,
    ] = await Promise.all([
        // appointment counts by status
        prisma.appointment.groupBy({
            by: ["status"],
            where: { counselorProfileId: profile.id },
            _count: { id: true },
        }),

        // average rating and total reviews
        prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { appointment: { counselorProfileId: profile.id } },
        }),

        // unique patients served
        prisma.appointment.findMany({
            where: { counselorProfileId: profile.id, status: "COMPLETED" },
            distinct: ["patientProfileId"],
            select: { patientProfileId: true },
        }),

        // next 5 upcoming appointments
        prisma.appointment.findMany({
            where: {
                counselorProfileId: profile.id,
                status: "SCHEDULED",
                slot: { startTime: { gte: now } },
            },
            include: {
                slot: { select: { startTime: true, endTime: true } },
                patient: { select: { fullName: true } },
            },
            orderBy: { slot: { startTime: "asc" } },
            take: 5,
        }),

        // recent 5 reviews
        prisma.review.findMany({
            where: { appointment: { counselorProfileId: profile.id } },
            include: {
                appointment: {
                    include: {
                        patient: { select: { fullName: true } },
                        slot: { select: { startTime: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),

        // rating distribution (1-5 stars)
        prisma.review.groupBy({
            by: ["rating"],
            where: { appointment: { counselorProfileId: profile.id } },
            _count: { id: true },
        }),

        // monthly appointment trends (last 6 months)
        prisma.$queryRaw<{ month: string; completed: bigint; cancelled: bigint; missed: bigint }[]>`
            SELECT
                TO_CHAR(s."startTime", 'YYYY-MM') AS month,
                COUNT(*) FILTER (WHERE a."status" = 'COMPLETED') AS completed,
                COUNT(*) FILTER (WHERE a."status" = 'CANCELLED') AS cancelled,
                COUNT(*) FILTER (WHERE a."status" = 'MISSED') AS missed
            FROM "Appointment" a
            JOIN "AvailabilitySlot" s ON a."slotId" = s."id"
            WHERE a."counselorProfileId" = ${profile.id}
                AND s."startTime" >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(s."startTime", 'YYYY-MM')
            ORDER BY month ASC
        `,

        // today's schedule
        (() => {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);

            return prisma.appointment.findMany({
                where: {
                    counselorProfileId: profile.id,
                    status: "SCHEDULED",
                    slot: { startTime: { gte: todayStart, lt: todayEnd } },
                },
                include: {
                    slot: { select: { startTime: true, endTime: true } },
                    patient: { select: { fullName: true } },
                },
                orderBy: { slot: { startTime: "asc" } },
            });
        })(),
    ]);

    // build status counts map
    const statusMap: Record<string, number> = { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0, MISSED: 0 };
    for (const entry of appointmentCounts) {
        statusMap[entry.status] = entry._count.id;
    }
    const totalAppointments = Object.values(statusMap).reduce((a, b) => a + b, 0);

    // calculate earnings from completed appointments
    const totalEarnings = statusMap.COMPLETED * Number(profile.hourlyRate);

    // build rating distribution array (always 5 entries for stars 1-5)
    const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of ratingDistribution) {
        ratingMap[entry.rating] = entry._count.id;
    }

    // format monthly trends for chart
    const monthlyTrends = monthlyAppointments.map((row) => ({
        month: row.month,
        completed: Number(row.completed),
        cancelled: Number(row.cancelled),
        missed: Number(row.missed),
    }));

    return {
        counselorName: profile.fullName,
        hourlyRate: Number(profile.hourlyRate),

        // summary stats
        totalAppointments,
        completedAppointments: statusMap.COMPLETED,
        cancelledAppointments: statusMap.CANCELLED,
        missedAppointments: statusMap.MISSED,
        scheduledAppointments: statusMap.SCHEDULED,
        totalEarnings,
        uniquePatients: uniquePatients.length,
        avgRating: totalReviewStats._avg.rating ? Math.round(totalReviewStats._avg.rating * 10) / 10 : 0,
        totalReviews: totalReviewStats._count.id,

        // chart data
        ratingDistribution: Object.entries(ratingMap).map(([stars, count]) => ({
            stars: `${stars}★`,
            count,
        })),
        monthlyTrends,

        // lists
        upcomingAppointments: upcomingAppointments.map((a) => ({
            id: a.id,
            patientName: a.patient.fullName,
            startTime: a.slot.startTime,
            endTime: a.slot.endTime,
        })),
        todayAppointments: todayAppointments.map((a) => ({
            id: a.id,
            patientName: a.patient.fullName,
            startTime: a.slot.startTime,
            endTime: a.slot.endTime,
        })),
        recentReviews: recentReviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            patientName: r.appointment.patient.fullName,
            date: r.appointment.slot.startTime,
        })),
    };
};
