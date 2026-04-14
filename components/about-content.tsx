"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Feather, BookOpen, Trophy, Lightbulb, Users, Zap, PenTool, Rocket, Settings, TrendingUp, Award, Share2 } from "lucide-react"
import { motion } from "framer-motion"

export function AboutContent() {
  const pillars = [
    {
      icon: Feather,
      title: "Your Voice, Amplified",
      content:
        "Express yourself without limits. Whether you're a poet, writer, artist, or storyteller, Whispr provides a space where your authentic voice becomes your superpower. Break free from algorithmic constraints and connect directly with people who value your perspective.",
    },
    {
      icon: PenTool,
      title: "Creative Freedom",
      content:
        "Post anything—poems, blog articles, short stories, visual art, chronicles of your journey, or unique writing chains. Whispr celebrates diverse forms of creative expression and gives every creator equal opportunity to be discovered and appreciated.",
    },
    {
      icon: Trophy,
      title: "Rewards & Recognition",
      content:
        "Earn meaningful rewards as you create, engage, and build your community. From writing your first piece to hitting engagement milestones, Whispr recognizes and rewards your dedication through our innovative gamification system.",
    },
  ]

  const features = [
    {
      icon: Lightbulb,
      label: "Smart Writing Tools",
      description: "Advanced features to enhance your creative workflow",
    },
    {
      icon: Users,
      label: "Community Connection",
      description: "Engage with thousands of passionate creators",
    },
    {
      icon: BookOpen,
      label: "Digital Portfolio",
      description: "Showcase your work professionally",
    },
    {
      icon: Zap,
      label: "Instant Publishing",
      description: "From idea to published in seconds",
    },
    {
      icon: TrendingUp,
      label: "Growth Analytics",
      description: "Track and optimize your audience reach",
    },
    {
      icon: Rocket,
      label: "Monetization Path",
      description: "Clear roadmap to sustainable income",
    },
  ]

  const standOut = [
    {
      icon: Settings,
      title: "Built for Creators",
      description: "Every feature prioritizes your success. Every decision puts creators first."
    },
    {
      icon: Share2,
      title: "Genuine Engagement",
      description: "Authentic connections between creators and readers without algorithmic manipulation."
    },
    {
      icon: Award,
      title: "Real Value",
      description: "Your work has true worth. Effort translates directly into opportunity and income."
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section className="w-full py-16 md:py-24 px-4">
      <div className="max-w-full mx-auto">
        {/* Core Pillars */}
        <div className="max-w-6xl mx-auto space-y-12 mb-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">What is Whispr?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A creator platform designed from the ground up to empower authentic voices, facilitate genuine connections, and create sustainable opportunities for those who create.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {pillars.map((pillar) => (
              <motion.div key={pillar.title} variants={itemVariants}>
                <Card
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur hover:from-card/80 hover:to-card/50 h-full"
                >
                  <CardContent className="p-6 space-y-4 h-full">
                    <motion.div 
                      className="h-14 w-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <pillar.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="font-serif text-xl font-semibold">{pillar.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{pillar.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Core Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.div 
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed as a creator
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div key={feature.label} variants={itemVariants}>
                <Card
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur hover:bg-card/70 h-full"
                >
                  <CardContent className="p-6 space-y-3">
                    <motion.div 
                      className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                      whileHover={{ rotate: 12, scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <feature.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h4 className="font-semibold text-sm">{feature.label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Our Philosophy */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.div 
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Our Philosophy</h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {standOut.map((item) => (
              <motion.div key={item.title} variants={itemVariants}>
                <Card
                  className="group border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 backdrop-blur transition-all duration-300 h-full"
                >
                  <CardContent className="p-8 space-y-4 h-full flex flex-col justify-center">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <item.icon className="h-10 w-10 text-primary mb-2" />
                    </motion.div>
                    <h4 className="font-serif text-xl font-semibold">{item.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* For Everyone */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20 backdrop-blur">
              <CardContent className="p-8 md:p-12 space-y-6">
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-center">Designed for Every Creator</h3>
                
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { icon: Feather, role: "Writers", description: "Share your stories, novels, and thoughts with a global audience" },
                    { icon: BookOpen, role: "Poets", description: "Express your deepest emotions through verse and imagery" },
                    { icon: Lightbulb, role: "Thought Leaders", description: "Share insights and expertise that shape conversations" },
                    { icon: PenTool, role: "Storytellers", description: "Build multi-chapter chronicles and serialized content" },
                  ].map((item) => (
                    <motion.div 
                      key={item.role} 
                      variants={itemVariants}
                      className="flex gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <item.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      </motion.div>
                      <div className="flex-grow">
                        <h4 className="font-semibold mb-1">{item.role}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
