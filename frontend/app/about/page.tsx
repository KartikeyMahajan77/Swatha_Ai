"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Target, Sparkles, Brain, Shield, Users, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const missions = [
  {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "Our Mission",
    description:
      "To democratize access to mental health support through ethical AI, making quality therapeutic care available to everyone, everywhere, at any time — especially in India where mental health resources are limited.",
  },
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Our Vision",
    description:
      "A world where mental health support is accessible, private, and personalized — powered by trusted AI that truly understands you and guides you toward lasting emotional well-being.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Our Values",
    description:
      "Privacy, Empathy, Innovation, and Trust form the cornerstone of Swastha AI — ensuring the highest standards of care, compassion, and emotional safety for every user.",
  },
];

const features = [
  {
    icon: <Brain className="w-6 h-6 text-primary" />,
    title: "AI-Powered Conversations",
    description: "Our AI listens, understands context, and responds with empathy — available 24/7 without judgment.",
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: "100% Private & Secure",
    description: "Your conversations are encrypted and never shared. Your mental health journey stays yours alone.",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Built for Everyone",
    description: "Whether you're dealing with stress, anxiety, or just need someone to talk to — Swastha AI is here.",
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-primary" />,
    title: "Always Improving",
    description: "We continuously improve our AI responses based on the latest therapeutic research and user feedback.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-24">

      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border border-primary/20 bg-primary/5 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-foreground/80">About Swastha AI</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          About Swastha AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Swastha AI is your personal mental health companion — combining
          cutting-edge AI technology with genuine empathy to support your
          emotional well-being, every single day.
        </p>
      </motion.div>

      {/* ── Mission Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 text-center h-full bg-card/50 backdrop-blur border border-primary/10 hover:border-primary/30 transition-all duration-300">
              <div className="mb-4 flex justify-center">{mission.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{mission.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{mission.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── What Makes Us Different ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-20"
      >
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          What Makes Swastha AI Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 flex gap-4 items-start bg-card/50 backdrop-blur border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center py-16 px-8 rounded-2xl border border-primary/20 bg-primary/5"
      >
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of people who have found peace and clarity with Swastha AI.
          Your first conversation is completely free.
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:to-primary"
        >
          <Link href="/login">
            Begin Your Journey
          </Link>
        </Button>
      </motion.div>

    </div>
  );
}
