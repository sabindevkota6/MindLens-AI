import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile, getAllSpecialties } from "@/lib/actions/counselor";
import EditProfileForm from "@/components/counselor/edit-profile-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditCounselorProfilePage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "COUNSELOR") {
        redirect("/login");
    }

    const [profile, specialties] = await Promise.all([
        getCounselorProfile(),
        getAllSpecialties()
    ]);

    if (!profile) {
        return <div>Profile not found. Please contact support.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Simple Header */}
            <div className="bg-brand-teal text-white py-8 px-6 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/counselor/profile">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Professional Profile</h1>
                            <p className="text-teal-100 text-sm">Update your information for patient visibility.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <EditProfileForm initialData={profile} specialties={specialties} />
            </div>
        </div>
    );
}
