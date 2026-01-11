"use client";

import { useEffect, useState } from "react";

interface ScrollSpyProps {
  sections: {
    id: string;
    label: string;
  }[];
}

export function ScrollSpy({ sections }: ScrollSpyProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all sections
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollToSection(id)}
          className="group relative"
          aria-label={`Go to ${label}`}
        >
          <div
            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
              activeSection === id
                ? "bg-teal-600 border-teal-600 scale-125"
                : "bg-transparent border-gray-400 hover:border-teal-600 hover:scale-110"
            }`}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
