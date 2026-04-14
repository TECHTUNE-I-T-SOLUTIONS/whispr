"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Feather, BookOpen, Globe, Zap, PenTool, Users, Award, Briefcase, Rocket, Trophy } from "lucide-react"
import { motion } from "framer-motion"

export function AboutStats() {
  const stats = [
    {
      icon: Feather,
      label: "Content Types",
      value: "Unlimited",
      description: "Poems, blogs, stories, chronicles, and more",
    },
    {
      icon: BookOpen,
      label: "Creator Community",
      value: "Growing",
      description: "Join thousands of passionate creators worldwide",
    },
    {
      icon: Globe,
      label: "Global Reach",
      value: "24/7",
      description: "Your work is accessible to the world any time",
    },
    {
      icon: Zap,
      label: "Earning Potential",
      value: "Unlimited",
      description: "Turn your passion into sustainable income",
    },
  ]

  const milestones = [
    {
      icon: PenTool,
      title: "Start Creating",
      description: "Write your first piece and join the Whispr community"
    },
    {
      icon: Users,
      title: "Build Your Audience",
      description: "Engage with readers and grow your loyal community"
    },
    {
      icon: Award,
      title: "Earn Rewards",
      description: "Unlock achievements and start earning from day one"
    },
    {
      icon: Briefcase,
      title: "Grow Your Brand",
      description: "Turn your Whispr profile into your professional portfolio"
    },
    {
      icon: Rocket,
      title: "Scale Your Impact",
      description: "Reach millions and establish yourself as a thought leader"
    },
    {
      icon: Trophy,
      title: "Celebrate Success",
      description: "Join our elite creators making real money on Whispr"
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
        {/* Platform Stats */}
        <div className="max-w-6xl mx-auto mb-20">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">By the Numbers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join a thriving ecosystem of creators reimagining what's possible when creators meet opportunity.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur text-center hover:from-card/80 hover:to-card/50 h-full">
                  <CardContent className="p-6 space-y-4">
                    <motion.div 
                      className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <stat.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold font-serif text-primary mb-1">{stat.value}</div>
                      <div className="font-medium text-sm mb-2">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.description}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Creator Journey */}
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Your Creator Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From your first post to becoming a successful creator—here's the path to success on Whispr.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {milestones.map((milestone) => (
              <motion.div key={milestone.title} variants={itemVariants}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card/50 to-background/50 backdrop-blur hover:from-card/70 hover:to-background/70 h-full">
                  <CardContent className="p-6 space-y-4">
                    <motion.div 
                      className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 12 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <milestone.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h4 className="font-serif text-lg font-semibold">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
