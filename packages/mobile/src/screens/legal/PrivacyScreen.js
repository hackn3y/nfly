import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Last Updated: October 20, 2025</Text>

        <Text style={styles.intro}>
          NFL Predictor ("we", "us", or "our") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your information when you use
          our mobile application and services.
        </Text>

        <Text style={styles.section}>1. Information We Collect</Text>

        <Text style={styles.subsection}>Personal Information</Text>
        <Text style={styles.text}>
          When you register, we collect:{'\n'}
          • Email address{'\n'}
          • Name (first and last){'\n'}
          • Date of birth (for age verification){'\n'}
          • Password (encrypted)
        </Text>

        <Text style={styles.subsection}>Usage Data</Text>
        <Text style={styles.text}>
          We automatically collect:{'\n'}
          • Device information (model, OS version){'\n'}
          • IP address{'\n'}
          • App usage statistics{'\n'}
          • Predictions you view or save{'\n'}
          • Features you use{'\n'}
          • Crash logs and error reports
        </Text>

        <Text style={styles.subsection}>Payment Information</Text>
        <Text style={styles.text}>
          We use Stripe for payment processing. We do NOT store:{'\n'}
          • Credit card numbers{'\n'}
          • CVV codes{'\n'}
          • Banking details{'\n\n'}
          We only store:{'\n'}
          • Stripe customer ID{'\n'}
          • Subscription status{'\n'}
          • Transaction history
        </Text>

        <Text style={styles.section}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use your information to:{'\n'}
          • Provide and maintain the Service{'\n'}
          • Process your subscription payments{'\n'}
          • Send you predictions and notifications{'\n'}
          • Improve our ML algorithms{'\n'}
          • Send important updates and announcements{'\n'}
          • Respond to customer support requests{'\n'}
          • Prevent fraud and abuse{'\n'}
          • Comply with legal obligations
        </Text>

        <Text style={styles.section}>3. Information Sharing</Text>
        <Text style={styles.text}>
          We do NOT sell your personal information. We may share data with:{'\n\n'}
          • Stripe (payment processing only){'\n'}
          • SendGrid (email delivery only){'\n'}
          • Cloud hosting providers (AWS, Railway, etc.){'\n'}
          • Analytics services (anonymized data){'\n'}
          • Law enforcement (if legally required)
        </Text>

        <Text style={styles.section}>4. Data Storage & Security</Text>
        <Text style={styles.text}>
          Your data is stored securely using:{'\n'}
          • Encrypted databases (PostgreSQL, MongoDB){'\n'}
          • HTTPS/SSL encryption for all transmissions{'\n'}
          • Password hashing (bcrypt){'\n'}
          • Regular security audits{'\n'}
          • Access controls and authentication{'\n\n'}
          However, no method of transmission over the internet is 100% secure. We cannot guarantee
          absolute security.
        </Text>

        <Text style={styles.section}>5. Data Retention</Text>
        <Text style={styles.text}>
          We retain your data:{'\n'}
          • Active accounts: Indefinitely{'\n'}
          • Deleted accounts: 90 days (for recovery){'\n'}
          • Payment records: 7 years (legal requirement){'\n'}
          • Usage logs: 2 years{'\n'}
          • Anonymized analytics: Indefinitely
        </Text>

        <Text style={styles.section}>6. Your Rights</Text>
        <Text style={styles.text}>
          You have the right to:{'\n\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Delete your account{'\n'}
          • Export your data{'\n'}
          • Opt-out of marketing emails{'\n'}
          • Withdraw consent{'\n'}
          • File a complaint with data protection authorities
        </Text>

        <Text style={styles.section}>7. GDPR Compliance (EU Users)</Text>
        <Text style={styles.text}>
          If you are in the European Union, you have additional rights under GDPR:{'\n'}
          • Right to be forgotten{'\n'}
          • Right to data portability{'\n'}
          • Right to restrict processing{'\n'}
          • Right to object to processing{'\n\n'}
          Legal basis for processing: Consent and contractual necessity.
        </Text>

        <Text style={styles.section}>8. CCPA Compliance (California Users)</Text>
        <Text style={styles.text}>
          California residents have the right to:{'\n'}
          • Know what personal information is collected{'\n'}
          • Know if personal information is sold (we do not sell){'\n'}
          • Access personal information{'\n'}
          • Delete personal information{'\n'}
          • Opt-out of sale (not applicable){'\n'}
          • Non-discrimination for exercising rights
        </Text>

        <Text style={styles.section}>9. Cookies & Tracking</Text>
        <Text style={styles.text}>
          We use:{'\n'}
          • Essential cookies (for login/sessions){'\n'}
          • Analytics cookies (Google Analytics - optional){'\n'}
          • Performance cookies (for app optimization){'\n\n'}
          You can disable cookies in your browser settings, but this may affect functionality.
        </Text>

        <Text style={styles.section}>10. Third-Party Links</Text>
        <Text style={styles.text}>
          Our Service may contain links to third-party websites. We are not responsible for their
          privacy practices. Please review their privacy policies before providing any information.
        </Text>

        <Text style={styles.section}>11. Children's Privacy</Text>
        <Text style={styles.text}>
          Our Service is not intended for anyone under 21 years of age. We do not knowingly collect
          information from minors. If you believe we have inadvertently collected such information,
          please contact us immediately.
        </Text>

        <Text style={styles.section}>12. International Data Transfers</Text>
        <Text style={styles.text}>
          Your information may be transferred to and stored in countries outside your residence. By
          using our Service, you consent to such transfers. We ensure adequate safeguards are in
          place to protect your data.
        </Text>

        <Text style={styles.section}>13. Changes to Privacy Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. We will notify you of any significant
          changes via:{'\n'}
          • Email notification{'\n'}
          • In-app notification{'\n'}
          • Website banner{'\n\n'}
          Your continued use of the Service after changes constitutes acceptance.
        </Text>

        <Text style={styles.section}>14. Data Breach Notification</Text>
        <Text style={styles.text}>
          In the event of a data breach affecting your personal information, we will:{'\n'}
          • Notify you within 72 hours{'\n'}
          • Describe the nature of the breach{'\n'}
          • Outline steps we're taking{'\n'}
          • Provide recommendations to protect yourself{'\n'}
          • Notify relevant authorities as required by law
        </Text>

        <Text style={styles.section}>15. Do Not Track</Text>
        <Text style={styles.text}>
          We honor Do Not Track (DNT) browser signals. If DNT is enabled, we will not track your
          browsing activity for advertising purposes.
        </Text>

        <Text style={styles.section}>16. Contact Us</Text>
        <Text style={styles.text}>
          For privacy-related questions or to exercise your rights:{'\n\n'}
          Email: privacy@nflpredictor.com{'\n'}
          Data Protection Officer: dpo@nflpredictor.com{'\n'}
          Address: [Your Company Address]{'\n'}
          Phone: [Your Phone Number]{'\n\n'}
          We will respond to requests within 30 days.
        </Text>

        <Text style={styles.section}>17. Account Deletion</Text>
        <Text style={styles.text}>
          To delete your account:{'\n'}
          1. Go to Profile → Settings{'\n'}
          2. Click "Delete Account"{'\n'}
          3. Confirm deletion{'\n\n'}
          Or email us at support@nflpredictor.com with "Delete Account" in the subject line.
        </Text>

        <Text style={styles.footer}>
          By using NFL Predictor, you acknowledge that you have read and understood this Privacy
          Policy and consent to our data practices as described herein.
        </Text>

        <Text style={styles.footer}>
          © 2025 NFL Predictor. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  intro: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D9FF',
    marginTop: 24,
    marginBottom: 12,
  },
  subsection: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00B4D8',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 8,
  },
  footer: {
    fontSize: 12,
    color: '#888',
    marginTop: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
