import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../../theme';

export default function TermsOfServiceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: January 1, 2025</Text>

        <Section title="1. Acceptance of Terms">
          <Text style={styles.paragraph}>
            By accessing and using NFL Predictor ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
          </Text>
        </Section>

        <Section title="2. Description of Service">
          <Text style={styles.paragraph}>
            NFL Predictor provides AI-powered predictions and analysis for NFL games. The Service combines machine learning models with numerological analysis (Gematria) to generate game predictions, statistics, and betting insights.
          </Text>
          <Text style={styles.paragraph}>
            The Service is provided for entertainment and informational purposes only. We do not guarantee the accuracy of predictions or any financial outcomes from using our predictions.
          </Text>
        </Section>

        <Section title="3. Age Requirement">
          <Text style={styles.paragraph}>
            You must be at least 21 years of age to use this Service. By using the Service, you represent and warrant that you are at least 21 years old.
          </Text>
        </Section>

        <Section title="4. User Accounts">
          <Text style={styles.paragraph}>
            To access certain features, you must create an account. You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account credentials</Text>
          <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>
          <Text style={styles.paragraph}>
            You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </Text>
        </Section>

        <Section title="5. Subscription and Payment">
          <Text style={styles.paragraph}>
            NFL Predictor offers multiple subscription tiers: Free, Starter ($9.99/month), Premium ($19.99/month), and Pro ($49.99/month).
          </Text>
          <Text style={styles.paragraph}>
            Subscriptions are billed monthly and automatically renew unless cancelled. You may cancel at any time through your account settings or the Stripe customer portal. Cancellations take effect at the end of the current billing period.
          </Text>
          <Text style={styles.paragraph}>
            All payments are processed securely through Stripe. We do not store your payment information on our servers.
          </Text>
          <Text style={styles.paragraph}>
            Refunds are provided at our sole discretion and are generally not offered for partial months of service.
          </Text>
        </Section>

        <Section title="6. Acceptable Use">
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>• Use the Service for any illegal purpose or in violation of any laws</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems or networks</Text>
          <Text style={styles.bulletPoint}>• Reverse engineer, decompile, or disassemble any part of the Service</Text>
          <Text style={styles.bulletPoint}>• Use automated systems (bots, scrapers) to access the Service</Text>
          <Text style={styles.bulletPoint}>• Share your account credentials with others</Text>
          <Text style={styles.bulletPoint}>• Resell or redistribute predictions or data from the Service</Text>
          <Text style={styles.bulletPoint}>• Upload viruses or malicious code</Text>
          <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
        </Section>

        <Section title="7. Intellectual Property">
          <Text style={styles.paragraph}>
            All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, data compilations, and software, are the exclusive property of NFL Predictor or its licensors and are protected by copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.paragraph}>
            You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes only.
          </Text>
        </Section>

        <Section title="8. Disclaimers and Limitations">
          <Text style={styles.paragraph}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </Text>
          <Text style={styles.paragraph}>
            We do not guarantee:
          </Text>
          <Text style={styles.bulletPoint}>• The accuracy, reliability, or completeness of predictions</Text>
          <Text style={styles.bulletPoint}>• That the Service will be uninterrupted or error-free</Text>
          <Text style={styles.bulletPoint}>• That defects will be corrected</Text>
          <Text style={styles.bulletPoint}>• That the Service is free of viruses or harmful components</Text>
          <Text style={styles.paragraph}>
            NFL predictions are inherently uncertain. Past performance does not guarantee future results. You use predictions at your own risk.
          </Text>
        </Section>

        <Section title="9. Limitation of Liability">
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NFL PREDICTOR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </Text>
          <Text style={styles.paragraph}>
            IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY.
          </Text>
        </Section>

        <Section title="10. Gambling Disclaimer">
          <Text style={styles.paragraph}>
            This Service is for entertainment and informational purposes only. We do not encourage, facilitate, or promote gambling.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for understanding and complying with all gambling laws in your jurisdiction. Gambling can be addictive. If you have a gambling problem, please seek help:
          </Text>
          <Text style={styles.bulletPoint}>• National Problem Gambling Helpline: 1-800-522-4700</Text>
          <Text style={styles.bulletPoint}>• www.ncpgambling.org</Text>
        </Section>

        <Section title="11. Third-Party Services">
          <Text style={styles.paragraph}>
            The Service may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of any third-party sites or services.
          </Text>
        </Section>

        <Section title="12. Data and Privacy">
          <Text style={styles.paragraph}>
            Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </Text>
        </Section>

        <Section title="13. Modifications to Service">
          <Text style={styles.paragraph}>
            We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice at any time.
          </Text>
          <Text style={styles.paragraph}>
            We may also modify these Terms of Service at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.
          </Text>
        </Section>

        <Section title="14. Termination">
          <Text style={styles.paragraph}>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
          </Text>
          <Text style={styles.paragraph}>
            Upon termination, your right to use the Service will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
          </Text>
        </Section>

        <Section title="15. Governing Law">
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>
        </Section>

        <Section title="16. Dispute Resolution">
          <Text style={styles.paragraph}>
            Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules.
          </Text>
          <Text style={styles.paragraph}>
            You waive any right to participate in a class action lawsuit or class-wide arbitration.
          </Text>
        </Section>

        <Section title="17. Severability">
          <Text style={styles.paragraph}>
            If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
          </Text>
        </Section>

        <Section title="18. Contact Information">
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us:
          </Text>
          <Text style={styles.bulletPoint}>• Email: support@nflpredictor.com</Text>
          <Text style={styles.bulletPoint}>• Website: https://nflpredictor.com</Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using NFL Predictor, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  lastUpdated: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  paragraph: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
    color: colors.text,
  },
  bulletPoint: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    color: colors.text,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.text,
  },
});
