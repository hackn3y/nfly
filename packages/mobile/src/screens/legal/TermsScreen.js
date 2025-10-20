import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.date}>Last Updated: October 20, 2025</Text>

        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using NFL Predictor ("the Service"), you agree to be bound by these Terms
          of Service. If you do not agree to these terms, please do not use the Service.
        </Text>

        <Text style={styles.section}>2. Age Requirement & Eligibility</Text>
        <Text style={styles.text}>
          You must be at least 21 years of age to use this Service. Sports betting and gambling are
          not legal in all jurisdictions. You are responsible for ensuring that your use of this
          Service complies with all applicable local, state, and federal laws.
        </Text>

        <Text style={styles.section}>3. Description of Service</Text>
        <Text style={styles.text}>
          NFL Predictor provides NFL game predictions using machine learning algorithms and gematria
          analysis. Our predictions are for informational and entertainment purposes only and should
          not be considered professional gambling advice.
        </Text>

        <Text style={styles.section}>4. No Guarantees</Text>
        <Text style={styles.text}>
          We do not guarantee the accuracy of our predictions. Past performance does not indicate
          future results. Sports outcomes are unpredictable, and you may lose money if you choose to
          place bets based on our predictions. We are not responsible for any financial losses you
          may incur.
        </Text>

        <Text style={styles.section}>5. Responsible Gambling</Text>
        <Text style={styles.text}>
          Gambling can be addictive and may lead to serious financial and personal problems. Please
          gamble responsibly and never wager more than you can afford to lose. If you or someone you
          know has a gambling problem, please call the National Problem Gambling Helpline at
          1-800-GAMBLER (1-800-426-2537) or visit ncpgambling.org for help.
        </Text>

        <Text style={styles.section}>6. Subscription & Billing</Text>
        <Text style={styles.text}>
          • Subscriptions automatically renew unless cancelled{'\n'}
          • You can cancel anytime from your account settings{'\n'}
          • Refunds are provided on a case-by-case basis within 7 days{'\n'}
          • We use Stripe for secure payment processing{'\n'}
          • Prices subject to change with 30 days notice
        </Text>

        <Text style={styles.section}>7. User Account</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your account and password. You
          agree to notify us immediately of any unauthorized use of your account.
        </Text>

        <Text style={styles.section}>8. Prohibited Uses</Text>
        <Text style={styles.text}>
          You may NOT:{'\n'}
          • Resell or redistribute our predictions{'\n'}
          • Use bots, scripts, or automated tools{'\n'}
          • Reverse engineer our ML models{'\n'}
          • Violate any applicable laws{'\n'}
          • Share your account with others{'\n'}
          • Use the Service for commercial purposes without permission
        </Text>

        <Text style={styles.section}>9. Intellectual Property</Text>
        <Text style={styles.text}>
          All content, including predictions, algorithms, designs, and text, is the property of NFL
          Predictor and protected by copyright and trademark laws. You may not copy, reproduce, or
          distribute any content without written permission.
        </Text>

        <Text style={styles.section}>10. Limitation of Liability</Text>
        <Text style={styles.text}>
          NFL Predictor is provided "AS IS" without warranties of any kind. We are not liable for:{'\n'}
          • Any losses from betting or gambling{'\n'}
          • Technical errors or service interruptions{'\n'}
          • Inaccurate predictions or data{'\n'}
          • Third-party actions or services{'\n'}
          • Any indirect, incidental, or consequential damages
        </Text>

        <Text style={styles.section}>11. Indemnification</Text>
        <Text style={styles.text}>
          You agree to indemnify and hold harmless NFL Predictor from any claims, damages, or
          expenses arising from your use of the Service or violation of these Terms.
        </Text>

        <Text style={styles.section}>12. Changes to Terms</Text>
        <Text style={styles.text}>
          We reserve the right to modify these Terms at any time. We will notify users of significant
          changes via email or in-app notification. Continued use of the Service after changes
          constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.section}>13. Termination</Text>
        <Text style={styles.text}>
          We reserve the right to terminate or suspend your account at any time for violation of
          these Terms or for any other reason at our discretion.
        </Text>

        <Text style={styles.section}>14. Governing Law</Text>
        <Text style={styles.text}>
          These Terms are governed by the laws of the United States and the state in which our
          company is registered. Any disputes will be resolved in the courts of that jurisdiction.
        </Text>

        <Text style={styles.section}>15. Severability</Text>
        <Text style={styles.text}>
          If any provision of these Terms is found to be invalid, the remaining provisions will
          continue in full force and effect.
        </Text>

        <Text style={styles.section}>16. Contact Information</Text>
        <Text style={styles.text}>
          For questions about these Terms, please contact us at:{'\n\n'}
          Email: support@nflpredictor.com{'\n'}
          Address: [Your Company Address]
        </Text>

        <Text style={styles.footer}>
          By using NFL Predictor, you acknowledge that you have read, understood, and agree to be
          bound by these Terms of Service.
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
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D9FF',
    marginTop: 24,
    marginBottom: 12,
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
