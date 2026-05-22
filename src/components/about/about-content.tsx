"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { BookOpen, Globe, TrendingUp, Users } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Competitive events",
    text: "Students test business knowledge through conferences at regional, state, and international levels.",
  },
  {
    icon: Users,
    title: "Leadership development",
    text: "Chapter officers plan meetings, fundraisers, and school-wide initiatives that grow membership and impact.",
  },
  {
    icon: Globe,
    title: "College & career ready",
    text: "DECA strengthens resumes, interview skills, and networking for students pursuing business and entrepreneurship.",
  },
  {
    icon: BookOpen,
    title: "Our chapter mission",
    text: "We create a supportive community where every member can learn, compete, and lead—whether you are new to DECA or returning for another year.",
  },
] as const;

export function AboutContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardTitle>What is DECA?</CardTitle>
        <p className="mt-3 text-sm leading-relaxed text-deca-navy/70 dark:text-white/70">
          DECA is a career and technical student organization that connects
          classroom learning to real-world business experiences. Members build
          skills in leadership, communication, teamwork, and problem solving
          while competing in role-plays, written events, and chapter projects
          that mirror professional industries.
        </p>
      </Card>

      {FEATURES.map((item) => (
        <Card key={item.title}>
          <item.icon className="mb-3 h-6 w-6 text-deca-gold" />
          <CardTitle>{item.title}</CardTitle>
          <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
            {item.text}
          </p>
        </Card>
      ))}
    </div>
  );
}
