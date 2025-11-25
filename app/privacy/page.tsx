'use client';

import { motion } from 'framer-motion';
import { Lock, Eye, Shield, Database, Share2, Bell, Trash2, Scale, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string[];
  subsections?: { title: string; content: string[] }[];
}

export default function PrivacyPolicyPage() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    setMounted(true);
  }, []);

  const sections: Section[] = [
    {
      id: 'introduction',
      icon: <Eye className="w-6 h-6" />,
      title: 'Introduction',
      content: [
        'Whispr ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.',
        'Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.',
        'We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy.',
      ],
    },
    {
      id: 'information-collection',
      icon: <Database className="w-6 h-6" />,
      title: 'Information We Collect',
      content: [
        'We collect information from you in a variety of ways. The information we may collect on the Service includes:',
      ],
      subsections: [
        {
          title: 'Personal Information You Provide',
          content: [
            'Name and email address when you create an account',
            'Profile information (bio, profile picture, display name)',
            'Content you create and publish (stories, poems, articles)',
            'Communications you send to us or other users',
            'Payment information when making purchases or subscriptions',
            'Feedback and customer service interactions',
          ],
        },
        {
          title: 'Information Collected Automatically',
          content: [
            'Device information (device type, operating system, browser type)',
            'Log data (pages visited, time spent, referral source)',
            'IP address and general location data',
            'Cookies and tracking pixels',
            'Analytics data about your interactions with the Service',
          ],
        },
      ],
    },
    {
      id: 'use-information',
      icon: <Bell className="w-6 h-6" />,
      title: 'How We Use Your Information',
      content: [
        'We use the information we collect in the following ways:',
        '• To operate and maintain the Service',
        '• To provide customer service and respond to your inquiries',
        '• To process transactions and send related information',
        '• To send promotional communications (with your consent)',
        '• To improve our Service and develop new features',
        '• To monitor and analyze trends, usage, and activities',
        '• To detect, prevent, and address fraud and security issues',
        '• To personalize your experience and provide customized content',
        '• To comply with legal obligations',
      ],
    },
    {
      id: 'disclosure-information',
      icon: <Share2 className="w-6 h-6" />,
      title: 'Disclosure of Your Information',
      content: [
        'We do not sell, trade, or rent your personal information to third parties. However, we may share your information in the following circumstances:',
      ],
      subsections: [
        {
          title: 'Service Providers',
          content: [
            'We share information with vendors and service providers who assist us in operating our website and conducting our business',
            'These service providers are bound by confidentiality agreements and are not permitted to use your information for other purposes',
          ],
        },
        {
          title: 'Legal Requirements',
          content: [
            'We may disclose your information when required by law or when we believe in good faith that disclosure is necessary',
            'This includes complying with court orders, legal processes, or government requests',
          ],
        },
        {
          title: 'Business Transfers',
          content: [
            'If Whispr is involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction',
            'We will provide notice before your information becomes subject to a different privacy policy',
          ],
        },
        {
          title: 'User Content',
          content: [
            'Any content you publish on the Service may be viewed by other users',
            'We do not restrict how other users may use your publicly available content',
          ],
        },
      ],
    },
    {
      id: 'data-security',
      icon: <Shield className="w-6 h-6" />,
      title: 'Data Security',
      content: [
        'We implement appropriate technical, administrative, and physical security measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        'These measures include encryption, secure servers, and access controls. However, no security system is impenetrable, and we cannot guarantee absolute security.',
        'You are responsible for maintaining the confidentiality of your account credentials. If you suspect unauthorized access to your account, please notify us immediately.',
      ],
    },
    {
      id: 'your-privacy-rights',
      icon: <Lock className="w-6 h-6" />,
      title: 'Your Privacy Rights',
      content: [
        'Depending on your location, you may have certain rights regarding your personal information:',
      ],
      subsections: [
        {
          title: 'Access and Portability',
          content: [
            'You have the right to access your personal information and receive a copy of your data',
            'You can download your content and data from your account settings',
          ],
        },
        {
          title: 'Correction',
          content: [
            'You can update and correct your account information at any time through your profile settings',
          ],
        },
        {
          title: 'Deletion',
          content: [
            'You have the right to request deletion of your account and associated personal information',
            'Some information may be retained for legal or business purposes',
          ],
        },
        {
          title: 'Objection',
          content: [
            'You can object to the processing of your information for marketing purposes',
            'You can opt out of promotional communications at any time',
          ],
        },
      ],
    },
    {
      id: 'cookies-tracking',
      icon: <Database className="w-6 h-6" />,
      title: 'Cookies and Tracking Technologies',
      content: [
        'We use cookies and similar tracking technologies to track activity on our Service and hold certain information. These technologies help us:',
        '• Remember your preferences and settings',
        '• Understand how you interact with the Service',
        '• Deliver personalized content and advertisements',
        '• Analyze usage patterns and improve functionality',
        'You can control cookie settings through your browser. However, disabling cookies may affect the functionality of the Service.',
      ],
    },
    {
      id: 'third-party-links',
      icon: <Share2 className="w-6 h-6" />,
      title: 'Third-Party Links',
      content: [
        'Our Service may contain links to third-party websites and services that are not operated by Whispr. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices.',
        'We encourage you to review the privacy policies of any third-party services before providing your personal information.',
      ],
    },
    {
      id: 'children-privacy',
      icon: <Eye className="w-6 h-6" />,
      title: 'Children\'s Privacy',
      content: [
        'The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly.',
        'For users between 13 and 18, we provide enhanced privacy protections. If a minor wants to delete content, they may request assistance through our contact information.',
      ],
    },
    {
      id: 'contact-us',
      icon: <Scale className="w-6 h-6" />,
      title: 'Contact Us',
      content: [
        'If you have questions about this Privacy Policy or our privacy practices, please contact us at:',
        'Email: whisprwords@gmail.com',
        'We will respond to your inquiry within 30 days of receipt.',
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
            <Lock className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Last Updated: November 2025</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            We value your privacy and are committed to being transparent about how we collect and use your data.
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
        className="relative py-16 md:py-24 px-4 bg-gradient-to-r from-foreground to-primary rounded-3xl mx-4 md:mx-auto mb-12 max-w-4xl mt-16"
      >
        <div className="relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Privacy Matters</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Have questions about how we handle your data? We're here to help clarify any concerns.
          </p>
          <motion.a
            href="mailto:whisprwords@gmail.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Privacy Inquiry
          </motion.a>
        </div>
      </motion.section>
    </div>
  );
}
