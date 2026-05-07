import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export type FuriganaSegment = {
  base: string;
  ruby?: string;
};

type FuriganaTextProps = {
  segments: FuriganaSegment[];
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  rubyStyle?: TextStyle;
  align?: 'left' | 'center';
};

export function FuriganaText({
  segments,
  containerStyle,
  textStyle,
  rubyStyle,
  align = 'left',
}: FuriganaTextProps) {
  return (
    <View style={[styles.row, align === 'center' && styles.center, containerStyle]}>
      {segments.map((segment, index) => (
        <View key={index} style={styles.segment}>
          <Text style={[styles.ruby, rubyStyle]}>{segment.ruby ?? ' '}</Text>
          <Text style={[styles.base, textStyle]}>{segment.base}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  center: {
    justifyContent: 'center',
  },
  segment: {
    alignItems: 'center',
    marginRight: 2,
  },
  ruby: {
    fontSize: 10,
    lineHeight: 12,
    color: '#7c684b',
  },
  base: {
    fontSize: 16,
    lineHeight: 22,
    color: '#241b11',
    fontWeight: '600',
  },
});
