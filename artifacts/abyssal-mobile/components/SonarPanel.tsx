import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import type { OceanSnapshot } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

type Region = 'breach' | 'plains' | 'city' | 'works' | 'reef';

const regionArt: Record<Region, number> = {
  breach: require('@/assets/images/game/bg/breach.jpg'),
  plains: require('@/assets/images/game/bg/plains.jpg'),
  city: require('@/assets/images/game/bg/city.jpg'),
  works: require('@/assets/images/game/bg/works.jpg'),
  reef: require('@/assets/images/game/bg/reef.jpg'),
};

type Diver = NonNullable<OceanSnapshot['divers']>[number];
type Creature = NonNullable<OceanSnapshot['creatures']>[number];
type Vehicle = NonNullable<OceanSnapshot['vehicles']>[number];

interface SonarPanelProps {
  region: Region;
  you: OceanSnapshot['you'];
  divers: Diver[];
  creatures: Creature[];
  vehicles: Vehicle[];
}

const WIDTH = 340;
const HEIGHT = 220;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const SCALE = 0.075;

function project(x: number, y: number, originX: number, originY: number) {
  return {
    x: CENTER_X + (x - originX) * SCALE,
    y: CENTER_Y + (y - originY) * SCALE,
  };
}

export function SonarPanel({ region, you, divers, creatures, vehicles }: SonarPanelProps) {
  const colors = useColors();
  const visibleDivers = divers.filter((diver) => diver.id !== you.id && diver.region === region);
  const visibleCreatures = creatures.filter((creature) => creature.alive && creature.region === region);
  const visibleVehicles = vehicles.filter((vehicle) => !vehicle.destroyed && vehicle.region === region);

  return (
    <View
      accessibilityLabel="Live sonar map"
      style={[styles.frame, { borderColor: colors.border, backgroundColor: colors.background }]}
    >
      <ImageBackground
        source={regionArt[region]}
        resizeMode="cover"
        imageStyle={styles.image}
        style={styles.imageStage}
      >
        <View style={[styles.tint, { backgroundColor: `${colors.background}B8` }]} />
        <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={StyleSheet.absoluteFill}>
          <Rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="transparent" />
          {[1, 2, 3, 4].map((index) => (
            <Line
              key={`vertical-${index}`}
              x1={index * (WIDTH / 5)}
              x2={index * (WIDTH / 5)}
              y1="0"
              y2={HEIGHT}
              stroke={colors.border}
              strokeOpacity={0.42}
              strokeWidth="1"
            />
          ))}
          {[1, 2, 3].map((index) => (
            <Line
              key={`horizontal-${index}`}
              x1="0"
              x2={WIDTH}
              y1={index * (HEIGHT / 4)}
              y2={index * (HEIGHT / 4)}
              stroke={colors.border}
              strokeOpacity={0.42}
              strokeWidth="1"
            />
          ))}
          {[44, 78, 112].map((radius) => (
            <Circle
              key={`range-${radius}`}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={radius}
              fill="transparent"
              stroke={colors.primary}
              strokeOpacity={0.18}
              strokeWidth="1"
            />
          ))}
          {visibleVehicles.map((vehicle) => {
            const point = project(vehicle.x, vehicle.y, you.x, you.y);
            return (
              <Rect
                key={vehicle.id}
                x={point.x - 8}
                y={point.y - 5}
                width="16"
                height="10"
                rx="3"
                fill={colors.accent}
                opacity={0.96}
              />
            );
          })}
          {visibleCreatures.map((creature) => {
            const point = project(creature.x, creature.y, you.x, you.y);
            return (
              <Circle
                key={creature.id}
                cx={point.x}
                cy={point.y}
                r={creature.aggro ? 5 : 3.5}
                fill={creature.aggro ? colors.destructive : colors.mutedForeground}
              />
            );
          })}
          {visibleDivers.map((diver) => {
            const point = project(diver.x, diver.y, you.x, you.y);
            return (
              <Circle
                key={diver.id}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={colors.primary}
                stroke={colors.background}
                strokeWidth="2"
              />
            );
          })}
          <Circle cx={CENTER_X} cy={CENTER_Y} r="8" fill={colors.primary} />
          <Circle cx={CENTER_X} cy={CENTER_Y} r="13" fill="transparent" stroke={colors.primary} strokeWidth="1.5" />
          <Line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={CENTER_X + you.facing * 16}
            y2={CENTER_Y}
            stroke={colors.background}
            strokeWidth="2"
          />
        </Svg>
      </ImageBackground>
      <View style={[styles.legend, { backgroundColor: `${colors.background}E8` }]}>
        <LegendDot color={colors.primary} label="DIVER" textColor={colors.foreground} />
        <LegendDot color={colors.accent} label="HULL" textColor={colors.foreground} />
        <LegendDot color={colors.destructive} label="HOSTILE" textColor={colors.foreground} />
      </View>
    </View>
  );
}

function LegendDot({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 220,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 8,
  },
  image: {
    opacity: 0.76,
  },
  imageStage: {
    flex: 1,
  },
  tint: {
    ...StyleSheet.absoluteFill,
    opacity: 0.7,
  },
  legend: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 7,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
});
