// Sense Health — Abstract Wave SVG Separator
// Flowing wave for section dividers and card backgrounds
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';

export default function AbstractWaveSvg({
  width = 400,
  height = 60,
  style,
  colors = ['#52A8A2', '#85C7C3'],
  opacity = 0.15,
  flip = false,
}) {
  const transform = flip ? `scale(1, -1) translate(0, -${height})` : undefined;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 400 60`}>
        <Defs>
          <SvgGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors[0]} stopOpacity={opacity} />
            <Stop offset="50%" stopColor={colors[1]} stopOpacity={opacity * 1.5} />
            <Stop offset="100%" stopColor={colors[0]} stopOpacity={opacity} />
          </SvgGradient>
          <SvgGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors[1]} stopOpacity={opacity * 0.6} />
            <Stop offset="50%" stopColor={colors[0]} stopOpacity={opacity * 0.8} />
            <Stop offset="100%" stopColor={colors[1]} stopOpacity={opacity * 0.6} />
          </SvgGradient>
        </Defs>

        {/* Primary wave */}
        <Path
          d="M0,35 C50,15 100,45 150,30 C200,15 250,40 300,25 C350,10 380,35 400,30 L400,60 L0,60 Z"
          fill="url(#waveGrad)"
          transform={transform}
        />

        {/* Secondary wave (offset) */}
        <Path
          d="M0,40 C60,25 120,50 180,35 C240,20 300,45 360,30 L400,35 L400,60 L0,60 Z"
          fill="url(#waveGrad2)"
          transform={transform}
        />
      </Svg>
    </View>
  );
}
