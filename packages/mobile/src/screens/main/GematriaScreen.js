import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { calculateGematria } from '../../store/slices/gematriaSlice';
import { colors, spacing, typography } from '../../theme';

export default function GematriaScreen() {
  const dispatch = useDispatch();
  const { calculation, loading } = useSelector((state) => state.gematria);
  const [text, setText] = useState('');
  const [selectedMethods, setSelectedMethods] = useState(['english', 'pythagorean', 'chaldean']);

  const handleCalculate = () => {
    if (text.trim()) {
      dispatch(calculateGematria({
        text: text.trim(),
        methods: selectedMethods,
      }));
    }
  };

  const toggleMethod = (method) => {
    if (selectedMethods.includes(method)) {
      setSelectedMethods(selectedMethods.filter(m => m !== method));
    } else {
      setSelectedMethods([...selectedMethods, method]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Gematria assigns numerical values to letters. Enter any text to calculate its value
            using different cipher systems.
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Text</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g., Kansas City Chiefs"
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: colors.primary } }}
          />

          {/* Method Selection */}
          <Text style={styles.label}>Select Calculation Methods:</Text>
          <View style={styles.methodsContainer}>
            <MethodChip
              label="English"
              active={selectedMethods.includes('english')}
              onPress={() => toggleMethod('english')}
            />
            <MethodChip
              label="Pythagorean"
              active={selectedMethods.includes('pythagorean')}
              onPress={() => toggleMethod('pythagorean')}
            />
            <MethodChip
              label="Chaldean"
              active={selectedMethods.includes('chaldean')}
              onPress={() => toggleMethod('chaldean')}
            />
          </View>

          <TouchableOpacity
            style={styles.calculateButton}
            onPress={handleCalculate}
            disabled={loading || !text.trim() || selectedMethods.length === 0}
          >
            <Text style={styles.calculateButtonText}>
              {loading ? 'Calculating...' : 'Calculate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {calculation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results for "{calculation.text}"</Text>

            {calculation.results && Object.entries(calculation.results).map(([method, data]) => (
              <View key={method} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.methodName}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                  <Icon name="chevron-right" size={24} color={colors.placeholder} />
                </View>
                <View style={styles.resultValues}>
                  <View style={styles.valueBox}>
                    <Text style={styles.valueLabel}>Full Value</Text>
                    <Text style={styles.valueNumber}>{data.value}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.valueBox}>
                    <Text style={styles.valueLabel}>Reduced</Text>
                    <Text style={styles.valueNumber}>{data.reduced}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Patterns (if any) */}
            <View style={styles.patternsCard}>
              <Text style={styles.patternsTitle}>Numerological Insights</Text>
              <Text style={styles.patternsText}>
                The number {calculation.results.english?.reduced} in numerology represents...
              </Text>
              <TouchableOpacity style={styles.learnMore}>
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Icon name="arrow-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Examples */}
        {!calculation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Examples</Text>
            <Text style={styles.examplesDesc}>Tap to calculate:</Text>
            <View style={styles.examplesContainer}>
              <ExampleChip text="Kansas City Chiefs" onPress={setText} />
              <ExampleChip text="Buffalo Bills" onPress={setText} />
              <ExampleChip text="Super Bowl" onPress={setText} />
              <ExampleChip text="Patrick Mahomes" onPress={setText} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function MethodChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.methodChip, active && styles.methodChipActive]}
      onPress={onPress}
    >
      {active && <Icon name="check" size={16} color={colors.background} style={{ marginRight: 4 }} />}
      <Text style={[styles.methodText, active && styles.methodTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ExampleChip({ text, onPress }) {
  return (
    <TouchableOpacity
      style={styles.exampleChip}
      onPress={() => onPress(text)}
    >
      <Text style={styles.exampleText}>{text}</Text>
      <Icon name="calculator" size={16} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    marginLeft: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.placeholder,
    marginBottom: spacing.sm,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.text,
  },
  methodTextActive: {
    color: colors.background,
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  methodName: {
    ...typography.h3,
  },
  resultValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  valueNumber: {
    ...typography.h1,
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  patternsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  patternsTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  patternsText: {
    color: colors.placeholder,
    marginBottom: spacing.md,
  },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  learnMoreText: {
    color: colors.primary,
    fontWeight: '600',
  },
  examplesDesc: {
    color: colors.placeholder,
    marginBottom: spacing.md,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  exampleText: {
    color: colors.text,
  },
});
