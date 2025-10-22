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

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: January 1, 2025</Text>

        <Text style={styles.intro}>
          NFL Predictor ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
        </Text>

        <Section title="1. Information We Collect">
          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you create an account, we collect:
          </Text>
          <Text style={styles.bulletPoint}>• Name (first and last)</Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Password (encrypted)</Text>
          <Text style={styles.bulletPoint}>• Date of birth (to verify age requirement)</Text>

          <Text style={styles.subsectionTitle}>Usage Data</Text>
          <Text style={styles.paragraph}>
            We automatically collect information about your use of the Service:
          </Text>
          <Text style={styles.bulletPoint}>• Device information (type, operating system, unique device identifiers)</Text>
          <Text style={styles.bulletPoint}>• IP address and location data (approximate)</Text>
          <Text style={styles.bulletPoint}>• App usage statistics (features accessed, time spent)</Text>
          <Text style={styles.bulletPoint}>• Prediction history and preferences</Text>
          <Text style={styles.bulletPoint}>• Favorite teams and settings</Text>

          <Text style={styles.subsectionTitle}>Payment Information</Text>
          <Text style={styles.paragraph}>
            Payment processing is handled by Stripe. We do not store your full credit card information on our servers. Stripe collects:
          </Text>
          <Text style={styles.bulletPoint}>• Payment card details</Text>
          <Text style={styles.bulletPoint}>• Billing address</Text>
          <Text style={styles.bulletPoint}>• Transaction history</Text>
        </Section>

        <Section title="2. How We Use Your Information">
          <Text style={styles.paragraph}>
            We use collected information for the following purposes:
          </Text>
          <Text style={styles.bulletPoint}>• To provide and maintain the Service</Text>
          <Text style={styles.bulletPoint}>• To create and manage your account</Text>
          <Text style={styles.bulletPoint}>• To process subscription payments and transactions</Text>
          <Text style={styles.bulletPoint}>• To generate personalized predictions and recommendations</Text>
          <Text style={styles.bulletPoint}>• To send service-related notifications and updates</Text>
          <Text style={styles.bulletPoint}>• To respond to your inquiries and support requests</Text>
          <Text style={styles.bulletPoint}>• To improve and optimize the Service</Text>
          <Text style={styles.bulletPoint}>• To detect and prevent fraud and abuse</Text>
          <Text style={styles.bulletPoint}>• To analyze usage patterns and trends</Text>
          <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
        </Section>

        <Section title="3. Data Storage and Security">
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption in transit (HTTPS/TLS)</Text>
          <Text style={styles.bulletPoint}>• Encrypted password storage (bcrypt)</Text>
          <Text style={styles.bulletPoint}>• Secure database access controls</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Limited employee access to personal data</Text>
          <Text style={styles.paragraph}>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </Text>
          <Text style={styles.paragraph}>
            Your data is stored on secure servers located in the United States.
          </Text>
        </Section>

        <Section title="4. Data Sharing and Disclosure">
          <Text style={styles.paragraph}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
          </Text>

          <Text style={styles.subsectionTitle}>Service Providers</Text>
          <Text style={styles.paragraph}>
            We share data with trusted third-party service providers who assist us in operating the Service:
          </Text>
          <Text style={styles.bulletPoint}>• Stripe (payment processing)</Text>
          <Text style={styles.bulletPoint}>• AWS/Cloud hosting providers (infrastructure)</Text>
          <Text style={styles.bulletPoint}>• Email service providers (notifications)</Text>
          <Text style={styles.bulletPoint}>• Analytics services (usage tracking)</Text>
          <Text style={styles.paragraph}>
            These service providers are contractually obligated to protect your data and use it only for the purposes we specify.
          </Text>

          <Text style={styles.subsectionTitle}>Legal Requirements</Text>
          <Text style={styles.paragraph}>
            We may disclose your information if required by law or in response to:
          </Text>
          <Text style={styles.bulletPoint}>• Court orders or subpoenas</Text>
          <Text style={styles.bulletPoint}>• Law enforcement requests</Text>
          <Text style={styles.bulletPoint}>• Protection of our rights or property</Text>
          <Text style={styles.bulletPoint}>• Investigation of fraud or security issues</Text>
          <Text style={styles.bulletPoint}>• Protection of user safety</Text>

          <Text style={styles.subsectionTitle}>Business Transfers</Text>
          <Text style={styles.paragraph}>
            If we are involved in a merger, acquisition, or asset sale, your personal information may be transferred. We will provide notice before your information is transferred and becomes subject to a different privacy policy.
          </Text>
        </Section>

        <Section title="5. Your Data Rights">
          <Text style={styles.paragraph}>
            You have the following rights regarding your personal data:
          </Text>

          <Text style={styles.subsectionTitle}>Access and Portability</Text>
          <Text style={styles.bulletPoint}>• Request a copy of your personal data</Text>
          <Text style={styles.bulletPoint}>• Export your prediction history and statistics</Text>

          <Text style={styles.subsectionTitle}>Correction</Text>
          <Text style={styles.bulletPoint}>• Update or correct inaccurate information through your profile settings</Text>

          <Text style={styles.subsectionTitle}>Deletion</Text>
          <Text style={styles.bulletPoint}>• Request deletion of your account and personal data</Text>
          <Text style={styles.bulletPoint}>• Note: We may retain certain information as required by law or for legitimate business purposes</Text>

          <Text style={styles.subsectionTitle}>Opt-Out</Text>
          <Text style={styles.bulletPoint}>• Unsubscribe from marketing emails (link provided in emails)</Text>
          <Text style={styles.bulletPoint}>• Disable push notifications in device settings</Text>

          <Text style={styles.paragraph}>
            To exercise these rights, please contact us at support@nflpredictor.com
          </Text>
        </Section>

        <Section title="6. Cookies and Tracking">
          <Text style={styles.paragraph}>
            We use cookies and similar tracking technologies to track activity and store certain information:
          </Text>
          <Text style={styles.bulletPoint}>• Session cookies (for authentication)</Text>
          <Text style={styles.bulletPoint}>• Preference cookies (to remember your settings)</Text>
          <Text style={styles.bulletPoint}>• Analytics cookies (to understand usage patterns)</Text>
          <Text style={styles.paragraph}>
            You can instruct your browser or device to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </Text>
        </Section>

        <Section title="7. Children's Privacy">
          <Text style={styles.paragraph}>
            Our Service is not intended for individuals under the age of 21. We do not knowingly collect personal information from anyone under 21 years of age.
          </Text>
          <Text style={styles.paragraph}>
            If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from anyone under 21 without verification of parental consent, we will take steps to remove that information from our servers.
          </Text>
        </Section>

        <Section title="8. Third-Party Links">
          <Text style={styles.paragraph}>
            Our Service may contain links to third-party websites or services (e.g., Discord, documentation sites). We are not responsible for the privacy practices of these external sites.
          </Text>
          <Text style={styles.paragraph}>
            We encourage you to review the privacy policies of any third-party sites you visit.
          </Text>
        </Section>

        <Section title="9. Data Retention">
          <Text style={styles.paragraph}>
            We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </Text>
          <Text style={styles.paragraph}>
            When you delete your account:
          </Text>
          <Text style={styles.bulletPoint}>• Personal information is deleted within 30 days</Text>
          <Text style={styles.bulletPoint}>• Anonymized usage data may be retained for analytics</Text>
          <Text style={styles.bulletPoint}>• Transaction records may be retained as required by law (typically 7 years)</Text>
        </Section>

        <Section title="10. International Data Transfers">
          <Text style={styles.paragraph}>
            Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
          </Text>
          <Text style={styles.paragraph}>
            If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including personal information, to the United States and process it there.
          </Text>
        </Section>

        <Section title="11. California Privacy Rights (CCPA)">
          <Text style={styles.paragraph}>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act:
          </Text>
          <Text style={styles.bulletPoint}>• Right to know what personal information is collected, used, shared, or sold</Text>
          <Text style={styles.bulletPoint}>• Right to delete personal information held by us</Text>
          <Text style={styles.bulletPoint}>• Right to opt-out of the sale of personal information (we do not sell personal information)</Text>
          <Text style={styles.bulletPoint}>• Right to non-discrimination for exercising CCPA rights</Text>
          <Text style={styles.paragraph}>
            To exercise these rights, email us at support@nflpredictor.com with "CCPA Request" in the subject line.
          </Text>
        </Section>

        <Section title="12. Changes to This Privacy Policy">
          <Text style={styles.paragraph}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by:
          </Text>
          <Text style={styles.bulletPoint}>• Posting the new Privacy Policy on this page</Text>
          <Text style={styles.bulletPoint}>• Updating the "Last Updated" date</Text>
          <Text style={styles.bulletPoint}>• Sending an email notification for material changes</Text>
          <Text style={styles.paragraph}>
            You are advised to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.
          </Text>
        </Section>

        <Section title="13. Contact Us">
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </Text>
          <Text style={styles.bulletPoint}>• Email: support@nflpredictor.com</Text>
          <Text style={styles.bulletPoint}>• Website: https://nflpredictor.com</Text>
          <Text style={styles.bulletPoint}>• Mail: NFL Predictor Privacy Team</Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using NFL Predictor, you acknowledge that you have read and understood this Privacy Policy.
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  intro: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.xl,
    color: colors.text,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  subsectionTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
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
