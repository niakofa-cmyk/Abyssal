import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ComponentProps } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetOceanRoster,
  useOceanAction,
  type OceanActionMutationVariables,
  type OceanIntent,
  type OceanReply,
  type OceanSnapshot,
  type SectorReport,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { SonarPanel } from '@/components/SonarPanel';

const TOKEN_KEY = 'abyssal-diver-v1';
const CALLSIGN_KEY = 'abyssal-callsign-v1';
const REGIONS = [
  { id: 'breach', name: 'The Breach', depth: '140 m' },
  { id: 'plains', name: 'Abyssal Plains', depth: '310 m' },
  { id: 'city', name: 'Submerged City', depth: '90 m' },
  { id: 'works', name: 'Industrial Depths', depth: '260 m' },
  { id: 'reef', name: 'Living Reef', depth: '70 m' },
] as const;

type Region = (typeof REGIONS)[number]['id'];
type ViewMode = 'briefing' | 'dive';
type PulseAction = 'use' | 'repair' | 'cycle';

const EMPTY_INTENT: OceanIntent = {
  ax: 0,
  ay: 0,
  aimX: 1,
  aimY: 0,
  fire: false,
  use: false,
  repair: false,
  cycle: false,
};

function haptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

function regionInfo(id: string) {
  return REGIONS.find((region) => region.id === id) ?? REGIONS[0];
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const rosterQuery = useGetOceanRoster({ query: { refetchInterval: 3500 } });
  const actionMutation = useOceanAction({
    request: { headers: { 'Content-Type': 'text/plain' } },
  });
  const actionRef = useRef(actionMutation.mutateAsync);
  const intentRef = useRef<OceanIntent>({ ...EMPTY_INTENT });
  const sending = useRef(false);
  const [callsign, setCallsign] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<OceanSnapshot | null>(null);
  const [view, setView] = useState<ViewMode>('briefing');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [apiError, setApiError] = useState('');
  const roster: SectorReport[] = rosterQuery.data?.roster ?? [];
  const you = snapshot?.you;
  const location = you ? regionInfo(you.region) : null;
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  actionRef.current = actionMutation.mutateAsync;

  useEffect(() => {
    let mounted = true;
    void Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(CALLSIGN_KEY)]).then(
      ([token, savedName]) => {
        if (!mounted) return;
        setSavedToken(token);
        if (savedName) setCallsign(savedName);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (view !== 'dive' || !savedToken) return;
    let active = true;
    let backoffMs = 300;
    let nextAllowedAt = 0;

    const sync = async () => {
      if (sending.current || Date.now() < nextAllowedAt) return;
      sending.current = true;
      const input = { ...intentRef.current };
      intentRef.current.use = false;
      intentRef.current.repair = false;
      intentRef.current.cycle = false;
      try {
        const result: OceanReply = await actionRef.current({
          data: { action: 'sync', token: savedToken, input },
        } satisfies OceanActionMutationVariables);
        if (!result.ok || !result.snap) {
          throw new Error(result.error ?? 'The ocean did not answer.');
        }
        if (active) {
          setSnapshot(result.snap);
          setApiError('');
        }
        backoffMs = 300;
        nextAllowedAt = 0;
      } catch (error) {
        if (active) setApiError(error instanceof Error ? error.message : 'Signal lost. Retrying.');
        nextAllowedAt = Date.now() + backoffMs;
        backoffMs = Math.min(backoffMs * 2, 8000);
      } finally {
        sending.current = false;
      }
    };

    void sync();
    const timer = setInterval(() => void sync(), 250);
    return () => {
      active = false;
      clearInterval(timer);
      intentRef.current = { ...EMPTY_INTENT };
    };
  }, [savedToken, view]);

  async function enterOcean() {
    const cleanCallsign = callsign.replace(/[<>]/g, '').trim().slice(0, 18) || 'Unmarked';
    setCallsign(cleanCallsign);
    setLocalError('');
    setApiError('');
    setBusy(true);
    Keyboard.dismiss();
    try {
      const result = await actionMutation.mutateAsync({
        data: { action: 'join', token: savedToken, callsign: cleanCallsign },
      });
      if (!result.ok || !result.token || !result.snap) {
        throw new Error(result.error ?? 'The ocean did not answer.');
      }
      await AsyncStorage.multiSet([
        [TOKEN_KEY, result.token],
        [CALLSIGN_KEY, cleanCallsign],
      ]);
      intentRef.current = { ...EMPTY_INTENT };
      setSavedToken(result.token);
      setSnapshot(result.snap);
      setView('dive');
      haptic();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'The signal could not be established.');
    } finally {
      setBusy(false);
    }
  }

  function leaveDive() {
    intentRef.current = { ...EMPTY_INTENT };
    setView('briefing');
    setApiError('');
  }

  function setMove(ax: number, ay: number) {
    intentRef.current.ax = ax;
    intentRef.current.ay = ay;
    haptic();
  }

  function setAim(aimX: number, aimY: number) {
    intentRef.current.aimX = aimX;
    intentRef.current.aimY = aimY;
    haptic();
  }

  function setFire(held: boolean) {
    intentRef.current.fire = held;
  }

  function pulse(action: PulseAction) {
    intentRef.current[action] = true;
    haptic();
    setTimeout(() => {
      intentRef.current[action] = false;
    }, 360);
  }

  const contentStyle = [
    styles.content,
    { paddingTop: topInset + 18, paddingBottom: bottomInset + 28 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <View style={[styles.markRing, { borderColor: colors.primary }]}>
              <Ionicons name="water" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.brandLabel, { color: colors.mutedForeground }]}>DESCENT 01</Text>
              <Text style={[styles.brandSub, { color: colors.foreground }]}>SHARED DEPTH</Text>
            </View>
          </View>
          <View style={[styles.signalPill, { borderColor: colors.border }]}>
            <View
              style={[
                styles.signalDot,
                { backgroundColor: rosterQuery.isError ? colors.destructive : colors.primary },
              ]}
            />
            <Text style={[styles.signalText, { color: colors.mutedForeground }]}>
              {rosterQuery.isError ? 'SIGNAL LOST' : 'OCEAN ONLINE'}
            </Text>
          </View>
        </View>

        {view === 'briefing' ? (
          <Briefing
            callsign={callsign}
            setCallsign={setCallsign}
            busy={busy}
            savedToken={savedToken}
            localError={localError}
            roster={roster}
            rosterLoading={rosterQuery.isLoading}
            rosterError={rosterQuery.isError}
            colors={colors}
            onEnter={() => void enterOcean()}
            onRetry={() => void rosterQuery.refetch()}
          />
        ) : you && location ? (
          <DiveConsole
            callsign={callsign}
            snapshot={snapshot}
            location={location}
            roster={roster}
            apiError={apiError}
            colors={colors}
            onLeave={leaveDive}
            onMove={setMove}
            onAim={setAim}
            onFire={setFire}
            onPulse={pulse}
          />
        ) : (
          <View style={styles.reconnect}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.reconnectText, { color: colors.mutedForeground }]}>Rejoining your signal…</Text>
            <Pressable onPress={leaveDive} style={[styles.secondaryButton, { borderColor: colors.border }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Return to briefing</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          ABYSSAL · THE LAST ASCENT
        </Text>
      </ScrollView>
    </View>
  );
}

function Briefing({
  callsign,
  setCallsign,
  busy,
  savedToken,
  localError,
  roster,
  rosterLoading,
  rosterError,
  colors,
  onEnter,
  onRetry,
}: {
  callsign: string;
  setCallsign: (value: string) => void;
  busy: boolean;
  savedToken: string | null;
  localError: string;
  roster: SectorReport[];
  rosterLoading: boolean;
  rosterError: boolean;
  colors: ReturnType<typeof useColors>;
  onEnter: () => void;
  onRetry: () => void;
}) {
  return (
    <>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/game/bg/breach.jpg')}
          resizeMode="cover"
          style={styles.heroImage}
          accessibilityLabel="Abyssal underwater expedition key art"
        />
        <View style={[styles.heroShade, { backgroundColor: `${colors.background}8F` }]} />
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>THE SEA DOES NOT RESET</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Abyssal</Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>The Last Ascent</Text>
          <Text style={[styles.intro, { color: colors.foreground }]}>
            Enter a shared ocean. Find the wreck’s records. Decide what the deep is hiding.
          </Text>
        </View>
      </View>

      <View style={[styles.callSignCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>YOUR BEACON</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Callsign</Text>
          </View>
          <Ionicons name="radio-outline" size={22} color={colors.mutedForeground} />
        </View>
        <TextInput
          value={callsign}
          onChangeText={setCallsign}
          maxLength={18}
          placeholder="Unmarked"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
          returnKeyType="go"
          onSubmitEditing={onEnter}
          testID="callsign-input"
          accessibilityLabel="Diver callsign"
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground },
          ]}
        />
        <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
          {savedToken ? 'Your beacon is saved. You can return to this dive.' : 'Your name follows your beacon through the ocean.'}
        </Text>
        {localError ? (
          <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.destructive }]}>
            {localError}
          </Text>
        ) : null}
        <Pressable
          onPress={onEnter}
          disabled={busy}
          testID="enter-ocean"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed || busy ? 0.78 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {savedToken ? 'Return to your dive' : 'Enter the ocean'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.regionHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>SHARED WORLD</Text>
          <Text style={[styles.regionTitle, { color: colors.foreground }]}>Sectors</Text>
        </View>
        <Pressable
          onPress={onRetry}
          testID="refresh-roster"
          accessibilityLabel="Refresh live sector roster"
          style={[styles.iconButton, { borderColor: colors.border }]}
        >
          <Ionicons name="refresh-outline" size={17} color={colors.foreground} />
        </Pressable>
      </View>
      {rosterError ? (
        <View style={[styles.errorCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="radio-outline" size={20} color={colors.accent} />
          <Text style={[styles.errorCardText, { color: colors.mutedForeground }]}>
            The roster is unavailable. Your dive can still be opened when the connection returns.
          </Text>
        </View>
      ) : null}
      {rosterLoading && !roster.length ? (
        <View style={[styles.loadingCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Listening for divers…</Text>
        </View>
      ) : (
        <View style={styles.sectorList}>
          {roster.filter((sector) => sector.state !== 'sealed').map((sector) => (
            <SectorCard key={sector.id} sector={sector} colors={colors} />
          ))}
        </View>
      )}
      <View style={[styles.sealedCard, { borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
        <Text style={[styles.sealedText, { color: colors.mutedForeground }]}>
          The trench, upper ocean, and surface are sealed in this build.
        </Text>
      </View>
    </>
  );
}

function SectorCard({
  sector,
  colors,
}: {
  sector: SectorReport;
  colors: ReturnType<typeof useColors>;
}) {
  const live = sector.state === 'live';
  return (
    <View style={[styles.sectorCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.sectorCopy}>
        <Text style={[styles.sectorName, { color: colors.foreground }]}>{sector.name}</Text>
        <Text style={[styles.sectorDepth, { color: colors.mutedForeground }]}>{sector.depth} · {sector.id.toUpperCase()}</Text>
      </View>
      <View style={styles.sectorStatus}>
        <View style={[styles.sectorDot, { backgroundColor: live ? colors.primary : colors.mutedForeground }]} />
        <Text style={[styles.sectorState, { color: live ? colors.primary : colors.mutedForeground }]}>
          {live ? `${sector.divers.length} DIVER${sector.divers.length === 1 ? '' : 'S'}` : 'ASLEEP'}
        </Text>
        {live && sector.boss?.alive ? (
          <Text style={[styles.mawStatus, { color: colors.accent }]}>MAW ACTIVE</Text>
        ) : null}
      </View>
      {live && sector.divers.length ? (
        <Text numberOfLines={1} style={[styles.diverNames, { color: colors.mutedForeground }]}>
          {sector.divers.map((diver) => diver.name).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

function DiveConsole({
  callsign,
  snapshot,
  location,
  roster,
  apiError,
  colors,
  onLeave,
  onMove,
  onAim,
  onFire,
  onPulse,
}: {
  callsign: string;
  snapshot: OceanSnapshot | null;
  location: (typeof REGIONS)[number];
  roster: SectorReport[];
  apiError: string;
  colors: ReturnType<typeof useColors>;
  onLeave: () => void;
  onMove: (ax: number, ay: number) => void;
  onAim: (aimX: number, aimY: number) => void;
  onFire: (held: boolean) => void;
  onPulse: (action: PulseAction) => void;
}) {
  const you = snapshot?.you;
  if (!snapshot || !you) return null;
  const neighbors = snapshot.divers?.filter((diver) => diver.id !== you.id && diver.region === you.region) ?? [];
  const currentSector = roster.find((sector) => sector.id === you.region);
  const events = [...(snapshot.toasts ?? []), ...(snapshot.events ?? [])].slice(-4).reverse();

  return (
    <View style={styles.diveLayout}>
      <View style={styles.diveHeading}>
        <Pressable onPress={onLeave} testID="return-to-briefing" accessibilityLabel="Return to briefing" style={[styles.backButton, { borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.diveHeadingText}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>DIVE IN PROGRESS</Text>
          <Text style={[styles.diveTitle, { color: colors.foreground }]}>{location.name}</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: `${colors.primary}1C` }]}>
          <View style={[styles.signalDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
        </View>
      </View>

      <View style={[styles.telemetryCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.telemetryTop}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>{callsign || you.name}</Text>
            <Text style={[styles.telemetryLocation, { color: colors.foreground }]}>{location.depth} · {you.seat ? `${you.seat.toUpperCase()} SEAT` : 'ON FOOT'}</Text>
          </View>
          <View style={[styles.regionChip, { borderColor: colors.border }]}>
            <Ionicons name="navigate-outline" size={13} color={colors.accent} />
            <Text style={[styles.regionChipText, { color: colors.accent }]}>{you.region.toUpperCase()}</Text>
          </View>
        </View>
        <Meter label="AIR" value={you.o2} colors={colors} />
        <Meter label="HEALTH" value={you.hp} colors={colors} />
        <View style={[styles.suppliesRow, { borderColor: colors.border }]}>
          <Supply label="AMMO" value={you.ammo} icon="radio-button-on-outline" colors={colors} />
          <Supply label="CELLS" value={you.cells} icon="battery-half-outline" colors={colors} />
          <Supply label="CREW" value={neighbors.length + 1} icon="people-outline" colors={colors} />
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>LOCAL CONTACTS</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sonar</Text>
        </View>
        <Text style={[styles.contactCount, { color: colors.mutedForeground }]}>
          {neighbors.length + (snapshot.creatures?.filter((creature) => creature.region === you.region && creature.alive).length ?? 0)} SIGNALS
        </Text>
      </View>
      <SonarPanel
        region={you.region as Region}
        you={you}
        divers={snapshot.divers ?? []}
        creatures={snapshot.creatures ?? []}
        vehicles={snapshot.vehicles ?? []}
      />
      {currentSector?.boss?.alive ? (
        <View style={[styles.threatCard, { borderColor: colors.destructive }]}>
          <Ionicons name="eye-outline" size={17} color={colors.destructive} />
          <Text style={[styles.threatText, { color: colors.destructive }]}>
            {currentSector.boss.name ?? 'HOSTILE'} · {Math.round(currentSector.boss.hp ?? 0)} / {Math.round(currentSector.boss.hpMax ?? 0)}
          </Text>
        </View>
      ) : null}

      {apiError ? (
        <View style={[styles.connectionCard, { borderColor: colors.destructive }]}>
          <Ionicons name="cloud-offline-outline" size={17} color={colors.destructive} />
          <Text style={[styles.connectionText, { color: colors.destructive }]}>{apiError}</Text>
        </View>
      ) : null}

      <View style={styles.controlsHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>TOUCH INTERFACE</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Control the dive</Text>
        </View>
        <Text style={[styles.controlHint, { color: colors.mutedForeground }]}>HOLD TO MOVE</Text>
      </View>
      <View style={[styles.controlsCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.controlColumn}>
          <Text style={[styles.padLabel, { color: colors.mutedForeground }]}>SWIM</Text>
          <View style={styles.pad}>
            <View style={styles.padRow}>
              <View style={styles.padBlank} />
              <MoveButton icon="chevron-up" x={0} y={-1} colors={colors} onMove={onMove} />
              <View style={styles.padBlank} />
            </View>
            <View style={styles.padRow}>
              <MoveButton icon="chevron-back" x={-1} y={0} colors={colors} onMove={onMove} />
              <MoveButton icon="ellipse" x={0} y={0} colors={colors} onMove={onMove} center />
              <MoveButton icon="chevron-forward" x={1} y={0} colors={colors} onMove={onMove} />
            </View>
            <View style={styles.padRow}>
              <View style={styles.padBlank} />
              <MoveButton icon="chevron-down" x={0} y={1} colors={colors} onMove={onMove} />
              <View style={styles.padBlank} />
            </View>
          </View>
        </View>
        <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />
        <View style={styles.controlColumn}>
          <Text style={[styles.padLabel, { color: colors.mutedForeground }]}>AIM</Text>
          <View style={styles.pad}>
            <View style={styles.padRow}>
              <View style={styles.padBlank} />
              <AimButton icon="arrow-up" x={0} y={-1} colors={colors} onAim={onAim} />
              <View style={styles.padBlank} />
            </View>
            <View style={styles.padRow}>
              <AimButton icon="arrow-back" x={-1} y={0} colors={colors} onAim={onAim} />
              <View style={[styles.aimCenter, { borderColor: colors.border }]}>
                <Ionicons name="radio-outline" size={17} color={colors.accent} />
              </View>
              <AimButton icon="arrow-forward" x={1} y={0} colors={colors} onAim={onAim} />
            </View>
            <View style={styles.padRow}>
              <View style={styles.padBlank} />
              <AimButton icon="arrow-down" x={0} y={1} colors={colors} onAim={onAim} />
              <View style={styles.padBlank} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.actionRow}>
        <ActionButton
          icon="flash"
          label="FIRE"
          colors={colors}
          onPressIn={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); }}
          onPressOut={() => undefined}
          onHold={onFire}
          testID="fire-control"
        />
        <TapAction icon="hand-left-outline" label="USE" colors={colors} onPress={() => onPulse('use')} testID="use-control" />
        <TapAction icon="construct-outline" label="REPAIR" colors={colors} onPress={() => onPulse('repair')} testID="repair-control" />
        <TapAction icon="swap-horizontal-outline" label="SEAT" colors={colors} onPress={() => onPulse('cycle')} testID="seat-control" />
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>RECENT SIGNAL</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dive log</Text>
        </View>
        <Text style={[styles.contactCount, { color: colors.mutedForeground }]}>{snapshot.seen?.length ?? 0} RECORDS</Text>
      </View>
      <View style={[styles.logCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {events.length ? events.map((event, index) => (
          <View key={`${event}-${index}`} style={styles.logRow}>
            <View style={[styles.logBullet, { backgroundColor: index === 0 ? colors.accent : colors.border }]} />
            <Text style={[styles.logText, { color: index === 0 ? colors.foreground : colors.mutedForeground }]}>{event}</Text>
          </View>
        )) : (
          <Text style={[styles.logText, { color: colors.mutedForeground }]}>
            No new transmissions. Explore, interact with the wreck, and listen for what the sector returns.
          </Text>
        )}
      </View>
      <Text style={[styles.lastPosition, { color: colors.mutedForeground }]}>
        BEACON POSITION · {Math.round(you.x)} / {Math.round(you.y)}
      </Text>
    </View>
  );
}

function Meter({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
}) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.meterRow}>
      <Text style={[styles.meterLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.meterTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.meterFill, { width: `${percentage}%`, backgroundColor: percentage < 25 ? colors.destructive : colors.primary }]} />
      </View>
      <Text style={[styles.meterValue, { color: colors.foreground }]}>{Math.round(value)}</Text>
    </View>
  );
}

function Supply({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.supply}>
      <Ionicons name={icon} size={15} color={colors.accent} />
      <Text style={[styles.supplyValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.supplyLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MoveButton({
  icon,
  x,
  y,
  colors,
  onMove,
  center = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  x: number;
  y: number;
  colors: ReturnType<typeof useColors>;
  onMove: (x: number, y: number) => void;
  center?: boolean;
}) {
  return (
    <Pressable
      onPressIn={() => onMove(x, y)}
      onPressOut={() => onMove(0, 0)}
      testID={`move-${x}-${y}`}
      accessibilityLabel={center ? 'Stop swimming' : 'Swim direction'}
      style={({ pressed }) => [
        styles.padButton,
        { backgroundColor: pressed ? colors.primary : colors.background, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={center ? 9 : 20} color={center ? colors.mutedForeground : colors.foreground} />
    </Pressable>
  );
}

function AimButton({
  icon,
  x,
  y,
  colors,
  onAim,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  x: number;
  y: number;
  colors: ReturnType<typeof useColors>;
  onAim: (x: number, y: number) => void;
}) {
  return (
    <Pressable
      onPress={() => onAim(x, y)}
      testID={`aim-${x}-${y}`}
      accessibilityLabel="Aim direction"
      style={({ pressed }) => [
        styles.padButton,
        { backgroundColor: pressed ? colors.accent : colors.background, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={17} color={colors.foreground} />
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  colors,
  onPressIn,
  onPressOut,
  onHold,
  testID,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  colors: ReturnType<typeof useColors>;
  onPressIn: () => void;
  onPressOut: () => void;
  onHold: (held: boolean) => void;
  testID: string;
}) {
  return (
    <Pressable
      onPressIn={() => { onPressIn(); onHold(true); }}
      onPressOut={() => { onPressOut(); onHold(false); }}
      testID={testID}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        { borderColor: colors.border, backgroundColor: pressed ? colors.primary : colors.secondary },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function TapAction({
  icon,
  label,
  colors,
  onPress,
  testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={() => { onPress(); haptic(); }}
      testID={testID}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        { borderColor: colors.border, backgroundColor: pressed ? colors.primary : colors.secondary },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  markRing: { height: 34, width: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5 },
  brandSub: { marginTop: 3, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  signalPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  signalDot: { width: 6, height: 6, borderRadius: 3 },
  signalText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hero: { height: 282, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 8 },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 22, gap: 4 },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { fontSize: 52, lineHeight: 60, fontFamily: 'Fraunces_400Regular' },
  subtitle: { fontSize: 23, fontFamily: 'Fraunces_400Regular' },
  intro: { marginTop: 8, maxWidth: 330, fontSize: 14, lineHeight: 21, fontFamily: 'Outfit_400Regular' },
  callSignCard: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  sectionTitle: { marginTop: 4, fontSize: 19, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 5, paddingHorizontal: 14, fontSize: 16 },
  inputHint: { marginTop: -4, fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 50, borderRadius: 4, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  errorText: { fontSize: 13, lineHeight: 19 },
  regionHeader: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regionTitle: { marginTop: 3, fontSize: 22, fontFamily: 'Fraunces_400Regular' },
  iconButton: { height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 19 },
  sectorList: { gap: 8 },
  sectorCard: { borderWidth: 1, borderRadius: 6, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  sectorCopy: { flex: 1, minWidth: 140 },
  sectorName: { fontSize: 14, fontWeight: '600' },
  sectorDepth: { marginTop: 4, fontSize: 10, letterSpacing: 0.7 },
  sectorStatus: { alignItems: 'flex-end', gap: 4 },
  sectorDot: { width: 5, height: 5, borderRadius: 3 },
  sectorState: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  mawStatus: { fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  diverNames: { width: '100%', fontSize: 11 },
  sealedCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 6, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sealedText: { flex: 1, fontSize: 11, lineHeight: 16 },
  loadingCard: { borderWidth: 1, borderRadius: 6, padding: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12 },
  errorCard: { borderWidth: 1, borderRadius: 6, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' },
  errorCardText: { flex: 1, fontSize: 12, lineHeight: 17 },
  footer: { marginTop: 8, textAlign: 'center', fontSize: 9, letterSpacing: 2 },
  reconnect: { minHeight: 340, alignItems: 'center', justifyContent: 'center', gap: 14 },
  reconnectText: { fontSize: 14 },
  secondaryButton: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 11 },
  secondaryButtonText: { fontSize: 13, fontWeight: '600' },
  diveLayout: { gap: 16 },
  diveHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  diveHeadingText: { flex: 1 },
  diveTitle: { marginTop: 3, fontSize: 22, fontFamily: 'Fraunces_400Regular' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  liveText: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  telemetryCard: { borderWidth: 1, borderRadius: 7, padding: 14, gap: 12 },
  telemetryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  telemetryLocation: { marginTop: 5, fontSize: 14, fontWeight: '600' },
  regionChip: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  regionChipText: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  meterLabel: { width: 50, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  meterTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },
  meterValue: { width: 25, textAlign: 'right', fontSize: 11, fontWeight: '600' },
  suppliesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, paddingTop: 10, borderTopWidth: 1 },
  supply: { minWidth: 64, flexDirection: 'row', alignItems: 'center', gap: 5 },
  supplyValue: { fontSize: 12, fontWeight: '700' },
  supplyLabel: { fontSize: 8, letterSpacing: 0.7 },
  contactCount: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  threatCard: { borderWidth: 1, borderRadius: 5, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  threatText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  connectionCard: { borderWidth: 1, borderRadius: 5, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  connectionText: { flex: 1, fontSize: 11, lineHeight: 15 },
  controlsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  controlHint: { marginBottom: 4, fontSize: 8, letterSpacing: 1 },
  controlsCard: { borderWidth: 1, borderRadius: 7, padding: 12, flexDirection: 'row', justifyContent: 'space-around', gap: 10 },
  controlColumn: { alignItems: 'center', gap: 8 },
  padLabel: { fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  pad: { gap: 4 },
  padRow: { flexDirection: 'row', gap: 4 },
  padBlank: { width: 42, height: 42 },
  padButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  aimCenter: { width: 42, height: 42, borderWidth: 1, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  controlDivider: { width: 1, alignSelf: 'stretch', opacity: 0.7 },
  actionRow: { flexDirection: 'row', gap: 7, justifyContent: 'space-between' },
  actionButton: { flex: 1, minHeight: 61, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  logCard: { borderWidth: 1, borderRadius: 6, padding: 13, gap: 10 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logBullet: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },
  logText: { flex: 1, fontSize: 12, lineHeight: 17 },
  lastPosition: { fontSize: 8, letterSpacing: 1.2, textAlign: 'right' },
});
