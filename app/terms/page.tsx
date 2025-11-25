'use client';

import { motion } from 'framer-motion';
import { FileText, Shield, Users, AlertCircle, Zap, Heart, Scale, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string[];
  subsections?: { title: string; content: string[] }[];
}

export default function TermsOfServicePage() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    setMounted(true);
  }, []);

  const sections: Section[] = [
    {
      id: 'acceptance',
      icon: <FileText className="w-6 h-6" />,
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using Whispr ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
        'These Terms of Service constitute the entire agreement between you and Whispr regarding the use of the Service and supersede all prior and contemporaneous agreements, communications, and proposals, whether oral, written, or electronic.',
        'Whispr reserves the right to modify these terms at any time. Your continued use of the Service following any changes constitutes your acceptance of the new terms.',
      ],
    },
    {
      id: 'user-responsibilities',
      icon: <Users className="w-6 h-6" />,
      title: 'User Responsibilities',
      content: [
        'You are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account or password.',
        'You agree to provide truthful, accurate, current, and complete information when creating your account. You are solely responsible for any content you upload or publish on the Service.',
        'You must not use the Service for any illegal or unauthorized purpose. You agree to comply with all laws, rules, and regulations applicable to your use of the Service.',
      ],
      subsections: [
        {
          title: 'Prohibited Conduct',
          content: [
            'Harassment, threats, or bullying of other users',
            'Posting false, misleading, or defamatory content',
            'Violating intellectual property rights of others',
            'Attempting to breach security measures or gain unauthorized access',
            'Engaging in spam, commercial solicitation, or mass promotion',
            'Publishing adult, explicit, or graphic content',
            'Using the platform for illegal activities',
          ],
        },
      ],
    },
    {
      id: 'content-ownership',
      icon: <Heart className="w-6 h-6" />,
      title: 'Content Ownership & Rights',
      content: [
        'You retain all rights to any content you create and publish on Whispr. By publishing content, you grant Whispr a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purposes of operating and promoting the Service.',
        'You represent and warrant that you own or have the necessary rights to all content you upload and that your content does not violate any third-party rights.',
        'Whispr does not claim ownership of user-generated content. However, Whispr reserves the right to remove any content that violates these terms or applicable laws.',
        'You understand that your content may be viewed by other users and that Whispr is not responsible for how others use your published content.',
      ],
    },
    {
      id: 'intellectual-property',
      icon: <Shield className="w-6 h-6" />,
      title: 'Intellectual Property',
      content: [
        'The Service, including all text, graphics, logos, images, and software, is the exclusive property of Whispr and is protected by copyright and other intellectual property laws.',
        'You may not reproduce, distribute, transmit, modify, or prepare derivative works from any materials on the Service without prior written permission from Whispr, except as permitted for your personal, non-commercial use.',
        'All trademarks, service marks, and logos are the property of Whispr or their respective owners. You may not use any of these marks without permission.',
      ],
    },
    {
      id: 'limitation-liability',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Limitation of Liability',
      content: [
        'To the fullest extent permitted by law, Whispr shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service, even if Whispr has been advised of the possibility of such damages.',
        'Your sole and exclusive remedy for dissatisfaction with the Service is to discontinue using the Service.',
        'Some jurisdictions do not allow the limitation of liability, so the above limitation may not apply to you.',
      ],
    },
    {
      id: 'disclaimer',
      icon: <Zap className="w-6 h-6" />,
      title: 'Disclaimer of Warranties',
      content: [
        'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.',
        'Whispr disclaims all warranties, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.',
        'Whispr does not warrant that the Service will be uninterrupted, timely, secure, or error-free.',
        'You acknowledge that your use of the Service is at your own risk and that you assume full responsibility for any damages to your device or loss of data resulting from the use of the Service.',
      ],
    },
    {
      id: 'account-termination',
      icon: <Lock className="w-6 h-6" />,
      title: 'Account Termination',
      content: [
        'Whispr reserves the right to terminate your account and access to the Service at any time, for any reason, without notice or liability.',
        'Grounds for termination include, but are not limited to: violation of these Terms of Service, illegal activity, harassment, or other conduct deemed harmful to the Service or other users.',
        'Upon termination, your right to use the Service immediately ceases. All content you have published may be retained by Whispr.',
      ],
    },
    {
      id: 'governing-law',
      icon: <Scale className="w-6 h-6" />,
      title: 'Governing Law',
      content: [
        'These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which Whispr is incorporated, without regard to its conflict of law provisions.',
        'You agree to submit to the exclusive jurisdiction of the courts located in that jurisdiction and waive any and all objections to the exercise of jurisdiction over you by such courts.',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 dark:from-slate-900 dark:to-slate-900/50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative py-16 md:py-24 px-4 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
          >
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Last Updated: November 2025</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
          >
            Terms of Service
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Please read these Terms of Service carefully before using Whispr. Your use of our platform constitutes your acceptance of these terms.
          </motion.p>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-1"
          >
            <div className="sticky top-24 space-y-2">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  variants={itemVariants}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 group ${
                    activeSection === section.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {section.icon}
                  </span>
                  <span className="text-sm font-medium hidden sm:inline">{section.title}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-3 space-y-12"
          >
            {sections.map((section) => (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className={`scroll-mt-20 transition-opacity duration-500 ${
                  activeSection === section.id ? 'opacity-100' : 'opacity-50'
                }`}
                id={section.id}
              >
                <div className="mb-8">
                  <motion.div
                    className="flex items-center gap-4 mb-6"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {section.icon}
                    </div>
                    <h2 className="text-3xl font-bold">{section.title}</h2>
                  </motion.div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {section.content.map((paragraph, idx) => (
                      <motion.p
                        key={idx}
                        variants={itemVariants}
                        className="text-muted-foreground leading-relaxed text-lg"
                      >
                        {paragraph}
                      </motion.p>
                    ))}
                  </motion.div>

                  {section.subsections && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-6 space-y-6"
                    >
                      {section.subsections.map((subsection, subIdx) => (
                        <motion.div key={subIdx} variants={itemVariants}>
                          <h3 className="text-xl font-semibold mb-4 text-foreground">
                            {subsection.title}
                          </h3>
                          <ul className="space-y-3">
                            {subsection.content.map((item, itemIdx) => (
                              <motion.li
                                key={itemIdx}
                                variants={itemVariants}
                                className="flex items-start gap-3 text-muted-foreground"
                              >
                                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="leading-relaxed">{item}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {activeSection === section.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative py-16 md:py-24 px-4 bg-gradient-to-r from-gray-600 to-primary dark:bg-gradient-to-r dark:from-gray-800 dark:to-primary/40 rounded-3xl mx-4 md:mx-auto mb-12 max-w-4xl mt-16"
      >
        <div className="relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            If you have any questions about these Terms of Service, please don't hesitate to contact us.
          </p>
          <motion.a
            href="mailto:contact@whisprwords.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Contact Us
          </motion.a>
        </div>
      </motion.section>
    </div>
  );
}
