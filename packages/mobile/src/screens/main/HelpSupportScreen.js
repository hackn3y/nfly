import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../../theme';

const FAQ_DATA = [
  {
    question: 'How accurate are the predictions?',
    answer: 'Our AI models achieve 54-55% accuracy on game outcomes, which is above the industry standard. Confidence scores help you identify the most reliable predictions.'
  },
  {
    question: 'What is Gematria analysis?',
    answer: 'Gematria is a numerological system that assigns numerical values to words and names. We combine this with traditional ML predictions for ensemble analysis.'
  },
  {
    question: 'How do I upgrade my subscription?',
    answer: 'Go to Profile > Subscription to view and upgrade your plan. We offer Starter ($9.99), Premium ($19.99), and Pro ($49.99) tiers.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards through Stripe. Your payment information is secure and never stored on our servers.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel your subscription at any time. You\'ll retain access until the end of your billing period.'
  },
  {
    question: 'How is the bankroll tracker used?',
    answer: 'The bankroll tracker (Pro feature) helps you manage your betting budget, track bets, and analyze your performance over time.'
  },
  {
    question: 'Are predictions updated in real-time?',
    answer: 'Predictions are generated before games and updated periodically. Pro users get live in-game predictions that update during the game.'
  },
  {
    question: 'What is a parlay?',
    answer: 'A parlay combines multiple bets into one. All picks must win for the parlay to pay out, but the potential return is much higher.'
  },
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@nflpredictor.com');
  };

  const openDocs = () => {
    Linking.openURL('https://docs.nflpredictor.com');
  };

  const openDiscord = () => {
    Linking.openURL('https://discord.gg/nflpredictor');
  };

  const submitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      Alert.alert('Required Fields', 'Please fill in both subject and message');
      return;
    }

    // In production, this would send to backend
    const emailBody = encodeURIComponent(
      `Subject: ${contactForm.subject}\n\nMessage:\n${contactForm.message}`
    );
    Linking.openURL(`mailto:support@nflpredictor.com?subject=${encodeURIComponent(contactForm.subject)}&body=${emailBody}`);

    setContactForm({ subject: '', message: '' });
    Alert.alert('Success', 'Your message has been sent!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionCard} onPress={openEmail}>
            <Icon name="email" size={24} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Email Support</Text>
              <Text style={styles.actionSubtitle}>support@nflpredictor.com</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={openDocs}>
            <Icon name="book-open-variant" size={24} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Documentation</Text>
              <Text style={styles.actionSubtitle}>Read our guides</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={openDiscord}>
            <Icon name="discord" size={24} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Discord Community</Text>
              <Text style={styles.actionSubtitle}>Join other users</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFAQ(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Icon
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text}
                />
              </View>

              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>

          <View style={styles.contactForm}>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor={colors.placeholder}
              value={contactForm.subject}
              onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="How can we help you?"
              placeholderTextColor={colors.placeholder}
              value={contactForm.message}
              onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitButton} onPress={submitContact}>
              <Text style={styles.submitButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appText}>NFL Predictor</Text>
          <Text style={styles.appText}>For entertainment purposes only. 21+ only.</Text>
        </View>
      </ScrollView>
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
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: colors.placeholder,
    fontSize: 12,
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  faqAnswer: {
    color: colors.placeholder,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  contactForm: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  appVersion: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  appText: {
    color: colors.placeholder,
    fontSize: 12,
    textAlign: 'center',
  },
});
