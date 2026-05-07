import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FuriganaSegment, FuriganaText } from './components/FuriganaText';

type TabKey = 'domestic' | 'military' | 'diplomacy' | 'officers' | 'cities';

type City = {
  id: string;
  name: string;
  ruby: string;
  faction: string;
  factionRuby: string;
  troops: number;
  defense: number;
  adjacent: string[];
};

type Officer = {
  name: string;
  ruby: string;
  faction: string;
  factionRuby: string;
  loyalty: number;
  leadership: number;
  might: number;
  intellect: number;
  politics: number;
  charm: number;
};

type LogEntry = {
  id: string;
  segments: FuriganaSegment[];
};

type GameState = {
  started: boolean;
  year: number;
  seasonIndex: number;
  gold: number;
  food: number;
  cities: City[];
  officers: Officer[];
  reserveOfficer?: Officer;
  alliances: Record<string, number>;
  logs: LogEntry[];
  nextLogId: number;
  selectedTab: TabKey;
  titleNote?: FuriganaSegment[];
  victory: boolean;
};

const playerFaction = { name: '蜀国', ruby: 'しょっこく' };

const seasonLabels = [
  { base: '春', ruby: 'はる' },
  { base: '夏', ruby: 'なつ' },
  { base: '秋', ruby: 'あき' },
  { base: '冬', ruby: 'ふゆ' },
];

const tabLabels: Record<TabKey, FuriganaSegment[]> = {
  domestic: [seg('内政', 'ねいせい')],
  military: [seg('軍事', 'ぐんじ')],
  diplomacy: [seg('外交', 'がいこう')],
  officers: [seg('武将', 'ぶしょう')],
  cities: [seg('城一覧', 'じょういちらん')],
};

const initialCities: City[] = [
  {
    id: 'chengdu',
    name: '成都',
    ruby: 'せいと',
    faction: '蜀国',
    factionRuby: 'しょっこく',
    troops: 18000,
    defense: 78,
    adjacent: ['chengyang'],
  },
  {
    id: 'chengyang',
    name: '城陽',
    ruby: 'じょうよう',
    faction: '魏国',
    factionRuby: 'ぎこく',
    troops: 12000,
    defense: 64,
    adjacent: ['chengdu', 'xuchang'],
  },
  {
    id: 'xuchang',
    name: '許昌',
    ruby: 'きょしょう',
    faction: '魏国',
    factionRuby: 'ぎこく',
    troops: 16500,
    defense: 72,
    adjacent: ['chengyang', 'jianye'],
  },
  {
    id: 'jianye',
    name: '建業',
    ruby: 'けんぎょう',
    faction: '呉国',
    factionRuby: 'ごこく',
    troops: 15000,
    defense: 69,
    adjacent: ['xuchang'],
  },
];

const startingOfficers: Officer[] = [
  {
    name: '劉備',
    ruby: 'りゅうび',
    faction: '蜀国',
    factionRuby: 'しょっこく',
    loyalty: 100,
    leadership: 86,
    might: 78,
    intellect: 74,
    politics: 82,
    charm: 96,
  },
  {
    name: '関羽',
    ruby: 'かんう',
    faction: '蜀国',
    factionRuby: 'しょっこく',
    loyalty: 95,
    leadership: 90,
    might: 97,
    intellect: 71,
    politics: 62,
    charm: 80,
  },
];

const reserveOfficer: Officer = {
  name: '趙雲',
  ruby: 'ちょううん',
  faction: '在野',
  factionRuby: 'ざいや',
  loyalty: 83,
  leadership: 88,
  might: 92,
  intellect: 76,
  politics: 68,
  charm: 84,
};

const eventTemplates: FuriganaSegment[][] = [
  [seg('飢饉', 'ききん'), seg(' が '), seg('発生', 'はっせい'), seg(' した')],
  [seg('豊作', 'ほうさく'), seg(' により '), seg('糧食', 'りょうしょく'), seg(' が増加', 'がぞうか')],
  [seg('商人', 'しょうにん'), seg(' が '), seg('金', 'きん'), seg(' を献上', 'をけんじょう')],
  [seg('流言', 'りゅうげん'), seg(' により '), seg('忠誠度', 'ちゅうせいど'), seg(' が低下', 'がていか')],
];

function seg(base: string, ruby?: string): FuriganaSegment {
  return { base, ruby };
}

function createInitialState(): GameState {
  return {
    started: false,
    year: 1,
    seasonIndex: 0,
    gold: 320,
    food: 640,
    cities: initialCities.map((city) => ({ ...city })),
    officers: startingOfficers.map((officer) => ({ ...officer })),
    reserveOfficer: { ...reserveOfficer },
    alliances: {},
    logs: [
      {
        id: 'log-1',
        segments: [
          seg('乱世', 'らんせい'),
          seg(' に '),
          seg('一城', 'いちじょう'),
          seg(' から '),
          seg('天下統一', 'てんかとういつ'),
          seg(' を目指', 'をめざ'),
          seg(' します'),
        ],
      },
    ],
    nextLogId: 2,
    selectedTab: 'domestic',
    titleNote: undefined,
    victory: false,
  };
}

function appendLog(state: GameState, segments: FuriganaSegment[]): GameState {
  return {
    ...state,
    logs: [...state.logs, { id: `log-${state.nextLogId}`, segments }],
    nextLogId: state.nextLogId + 1,
  };
}

function yearRuby(year: number) {
  const digits: Record<number, string> = {
    1: 'いち',
    2: 'に',
    3: 'さん',
    4: 'よん',
    5: 'ご',
    6: 'ろく',
    7: 'しち',
    8: 'はち',
    9: 'きゅう',
    10: 'じゅう',
  };

  return `だい${digits[year] ?? String(year)}ねん`;
}

function cloneCities(cities: City[]) {
  return cities.map((city) => ({ ...city, adjacent: [...city.adjacent] }));
}

function uniqueFactions(cities: City[]) {
  return Array.from(
    new Map(
      cities
        .filter((city) => city.faction !== playerFaction.name)
        .map((city) => [city.faction, { name: city.faction, ruby: city.factionRuby }]),
    ).values(),
  );
}

function ActionButton({
  label,
  onPress,
  active,
}: {
  label: FuriganaSegment[];
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <FuriganaText
        segments={label}
        align="center"
        containerStyle={styles.buttonLabel}
        textStyle={styles.buttonText}
        rubyStyle={styles.buttonRuby}
      />
    </Pressable>
  );
}

function StatCard({
  label,
  value,
}: {
  label: FuriganaSegment[];
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <FuriganaText segments={label} rubyStyle={styles.smallRuby} textStyle={styles.smallLabel} />
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState>(createInitialState);

  const playerCities = useMemo(
    () => game.cities.filter((city) => city.faction === playerFaction.name),
    [game.cities],
  );
  const playerCityIds = useMemo(() => new Set(playerCities.map((city) => city.id)), [playerCities]);
  const homeCity = playerCities[0];
  const totalTroops = useMemo(
    () => playerCities.reduce((sum, city) => sum + city.troops, 0),
    [playerCities],
  );
  const visibleCities = useMemo(
    () =>
      game.cities.filter(
        (city) =>
          playerCityIds.has(city.id) ||
          city.adjacent.some((adjacentCityId) => playerCityIds.has(adjacentCityId)),
      ),
    [game.cities, playerCityIds],
  );
  const adjacentTargets = useMemo(
    () =>
      game.cities.filter(
        (city) =>
          city.faction !== playerFaction.name &&
          city.adjacent.some((adjacentCityId) => playerCityIds.has(adjacentCityId)),
      ),
    [game.cities, playerCityIds],
  );

  const startGame = () => {
    setGame((current) => ({
      ...createInitialState(),
      started: true,
      titleNote: current.titleNote,
    }));
  };

  const updateState = (updater: (current: GameState) => GameState) => {
    setGame((current) => updater(current));
  };

  const handleDomestic = (action: 'tax' | 'farm' | 'fortify' | 'recruit' | 'arms') => {
    updateState((current) => {
      let next: GameState = {
        ...current,
        cities: cloneCities(current.cities),
      };

      const city = next.cities.find((item) => item.faction === playerFaction.name);
      if (!city) {
        return current;
      }

      if (action === 'tax') {
        next.gold += 140;
        next = appendLog(next, [seg('税', 'ぜい'), seg(' を増', 'をふ'), seg(' やし '), seg('金', 'きん'), seg(' を得', 'をえ'), seg(' た')]);
      }

      if (action === 'farm') {
        next.food += 220;
        next = appendLog(next, [seg('農業', 'のうぎょう'), seg(' を '), seg('奨励', 'しょうれい'), seg(' し '), seg('糧食', 'りょうしょく'), seg(' が増加', 'がぞうか')]);
      }

      if (action === 'fortify') {
        city.defense = Math.min(120, city.defense + 10);
        next = appendLog(next, [seg(city.name, city.ruby), seg(' の '), seg('城防', 'じょうぼう'), seg(' を固', 'をかた'), seg(' めた')]);
      }

      if (action === 'recruit') {
        if (next.gold < 80 || next.food < 60) {
          return appendLog(next, [seg('兵', 'へい'), seg(' の '), seg('募集', 'ぼしゅう'), seg(' に必要', 'にひつよう'), seg(' な '), seg('資源', 'しげん'), seg(' が不足', 'がふそく')]);
        }

        next.gold -= 80;
        next.food -= 60;
        city.troops += 700;
        next = appendLog(next, [seg('兵', 'へい'), seg(' を '), seg('募集', 'ぼしゅう'), seg(' し '), seg('兵力', 'へいりょく'), seg(' が増加', 'がぞうか')]);
      }

      if (action === 'arms') {
        next = appendLog(next, [seg('兵科', 'へいか'), seg(' を '), seg('歩兵', 'ほへい'), seg(' 中心', 'ちゅうしん'), seg(' に整', 'ととの'), seg(' えた')]);
      }

      return next;
    });
  };

  const handleAttack = (targetId: string) => {
    updateState((current) => {
      let next: GameState = {
        ...current,
        cities: cloneCities(current.cities),
      };

      const target = next.cities.find((city) => city.id === targetId);
      const attacker = next.cities.find(
        (city) =>
          city.faction === playerFaction.name && target?.adjacent.includes(city.id),
      );

      if (!target || !attacker) {
        return appendLog(next, [seg('攻撃', 'こうげき'), seg(' 可能', 'かのう'), seg(' な '), seg('城', 'しろ'), seg(' がありません')]);
      }

      const attackPower = attacker.troops + current.officers[0].leadership * 110;
      const defensePower = target.troops + target.defense * 130;

      attacker.troops = Math.max(1800, attacker.troops - 1200);
      next = appendLog(next, [
        seg(playerFaction.name, playerFaction.ruby),
        seg(' が '),
        seg(target.name, target.ruby),
        seg(' を '),
        seg('攻撃', 'こうげき'),
        seg(' した'),
      ]);

      if (attackPower >= defensePower) {
        target.faction = playerFaction.name;
        target.factionRuby = playerFaction.ruby;
        target.troops = Math.max(1600, attackPower - defensePower + 1800);
        target.defense = Math.max(48, target.defense - 8);
        next = appendLog(next, [
          seg(target.name, target.ruby),
          seg(' が '),
          seg('陥落', 'かんらく'),
          seg(' し '),
          seg(playerFaction.name, playerFaction.ruby),
          seg(' の '),
          seg('支配下', 'しはいか'),
          seg(' となった'),
        ]);

        if (next.cities.every((city) => city.faction === playerFaction.name)) {
          next.victory = true;
          next = appendLog(next, [seg('天下統一', 'てんかとういつ'), seg(' を '), seg('達成', 'たっせい'), seg(' した')]);
        }

        return next;
      }

      target.troops = Math.max(900, target.troops - 550);
      target.defense = Math.max(40, target.defense - 3);
      return appendLog(next, [
        seg(target.name, target.ruby),
        seg(' の '),
        seg('防衛', 'ぼうえい'),
        seg(' は堅', 'はかた'),
        seg(' く '),
        seg('次回', 'じかい'),
        seg(' の '),
        seg('再戦', 'さいせん'),
        seg(' が必要', 'がひつよう'),
      ]);
    });
  };

  const handleDiplomacy = (action: 'alliance' | 'discord' | 'buyoff' | 'marriage') => {
    updateState((current) => {
      let next: GameState = {
        ...current,
        cities: cloneCities(current.cities),
        alliances: { ...current.alliances },
      };

      const targetCity = adjacentTargets[0];
      const targetFaction = targetCity?.faction;
      const targetFactionRuby = targetCity?.factionRuby;

      if (!targetCity || !targetFaction || !targetFactionRuby) {
        return appendLog(next, [seg('外交', 'がいこう'), seg(' の対象', 'のたいしょう'), seg(' がありません')]);
      }

      if (action === 'alliance') {
        next.alliances[targetFaction] = 2;
        return appendLog(next, [
          seg(targetFaction, targetFactionRuby),
          seg(' へ '),
          seg('結盟', 'けつめい'),
          seg(' を申し込', 'をもうしこ'),
          seg(' み '),
          seg('盟約', 'めいやく'),
          seg(' が成立', 'がせいりつ'),
        ]);
      }

      if (action === 'discord') {
        const city = next.cities.find((item) => item.id === targetCity.id);
        if (city) {
          city.defense = Math.max(35, city.defense - 7);
        }

        return appendLog(next, [
          seg(targetFaction, targetFactionRuby),
          seg(' に '),
          seg('離間', 'りかん'),
          seg(' を仕掛', 'をしか'),
          seg(' け '),
          seg(targetCity.name, targetCity.ruby),
          seg(' の '),
          seg('守備', 'しゅび'),
          seg(' を乱', 'をみだ'),
          seg(' した'),
        ]);
      }

      if (action === 'buyoff') {
        if (next.gold < 150) {
          return appendLog(next, [seg('買収', 'ばいしゅう'), seg(' に必要', 'にひつよう'), seg(' な '), seg('金', 'きん'), seg(' が不足', 'がふそく')]);
        }

        next.gold -= 150;
        const city = next.cities.find((item) => item.id === targetCity.id);
        if (city) {
          city.troops = Math.max(800, city.troops - 700);
        }

        return appendLog(next, [
          seg(targetCity.name, targetCity.ruby),
          seg(' の '),
          seg('将兵', 'しょうへい'),
          seg(' を '),
          seg('買収', 'ばいしゅう'),
          seg(' し '),
          seg('忠誠度', 'ちゅうせいど'),
          seg(' を低下', 'をていか'),
        ]);
      }

      next.alliances[targetFaction] = Math.max(next.alliances[targetFaction] ?? 0, 1) + 1;
      return appendLog(next, [
        seg('婿取', 'むこと'),
        seg(' りで '),
        seg(targetFaction, targetFactionRuby),
        seg(' との '),
        seg('関係', 'かんけい'),
        seg(' が和', 'がやわ'),
        seg(' らいだ'),
      ]);
    });
  };

  const recruitOfficer = () => {
    updateState((current) => {
      if (!current.reserveOfficer) {
        return appendLog(current, [seg('在野武将', 'ざいやぶしょう'), seg(' はもう居', 'はもうい'), seg(' ない')]);
      }

      const next: GameState = {
        ...current,
        officers: [...current.officers, { ...current.reserveOfficer, faction: playerFaction.name, factionRuby: playerFaction.ruby }],
        reserveOfficer: undefined,
      };

      return appendLog(next, [
        seg('在野武将', 'ざいやぶしょう'),
        seg(' の '),
        seg(current.reserveOfficer.name, current.reserveOfficer.ruby),
        seg(' を '),
        seg('勧誘', 'かんゆう'),
        seg(' した'),
      ]);
    });
  };

  const endTurn = () => {
    updateState((current) => {
      let next: GameState = {
        ...current,
        cities: cloneCities(current.cities),
        alliances: { ...current.alliances },
      };

      Object.entries(next.alliances).forEach(([faction, turns]) => {
        const city = next.cities.find((item) => item.faction === faction);
        next.alliances[faction] = Math.max(0, turns - 1);
        if (turns === 1 && city) {
          next = appendLog(next, [seg(faction, city.factionRuby), seg(' との '), seg('盟約', 'めいやく'), seg(' が終了', 'がしゅうりょう')]);
        }
      });

      uniqueFactions(next.cities).forEach((factionInfo) => {
        const factionCities = next.cities.filter((city) => city.faction === factionInfo.name);
        factionCities.forEach((city) => {
          city.troops += 260;
          city.defense = Math.min(120, city.defense + 2);
        });
        next = appendLog(next, [seg(factionInfo.name, factionInfo.ruby), seg(' が '), seg('内政', 'ないせい'), seg(' を整', 'をととの'), seg(' えた')]);

        if ((next.alliances[factionInfo.name] ?? 0) > 0) {
          next = appendLog(next, [seg(factionInfo.name, factionInfo.ruby), seg(' は '), seg('結盟', 'けつめい'), seg(' により '), seg('静観', 'せいかん'), seg(' した')]);
          return;
        }

        const attacker = factionCities
          .slice()
          .sort((left, right) => right.troops - left.troops)
          .find((city) =>
            city.adjacent.some((adjacentId) =>
              next.cities.some(
                (target) => target.id === adjacentId && target.faction === playerFaction.name,
              ),
            ),
          );
        const defender = next.cities
          .filter(
            (city) =>
              city.faction === playerFaction.name &&
              attacker?.adjacent.includes(city.id),
          )
          .sort((left, right) => left.defense - right.defense)[0];

        if (!attacker || !defender) {
          return;
        }

        next = appendLog(next, [
          seg(factionInfo.name, factionInfo.ruby),
          seg(' が '),
          seg(defender.name, defender.ruby),
          seg(' を '),
          seg('攻撃', 'こうげき'),
          seg(' した'),
        ]);

        if (attacker.troops > defender.troops * 0.9 + defender.defense * 60) {
          defender.defense = Math.max(28, defender.defense - 8);
          defender.troops = Math.max(1200, defender.troops - 420);
          next = appendLog(next, [
            seg(defender.name, defender.ruby),
            seg(' の '),
            seg('城防', 'じょうぼう'),
            seg(' と '),
            seg('兵力', 'へいりょく'),
            seg(' が低下', 'がていか'),
          ]);
          return;
        }

        next = appendLog(next, [seg(defender.name, defender.ruby), seg(' は '), seg('防衛', 'ぼうえい'), seg(' に成功', 'にせいこう'), seg(' した')]);
      });

      const event = eventTemplates[(current.year + current.seasonIndex) % eventTemplates.length];
      next = appendLog(next, event);

      if (event[0].base === '豊作') {
        next.food += 120;
      }

      if (event[0].base === '商人') {
        next.gold += 90;
      }

      const nextSeasonIndex = (current.seasonIndex + 1) % seasonLabels.length;
      const nextYear = nextSeasonIndex === 0 ? current.year + 1 : current.year;

      return {
        ...next,
        seasonIndex: nextSeasonIndex,
        year: nextYear,
      };
    });
  };

  const renderTitle = () => (
    <View style={styles.titleScreen}>
      <FuriganaText
        segments={[
          seg('三國志', 'さんごくし'),
          seg('テキスト'),
          seg('戦略', 'せんりゃく'),
          seg('RPG'),
        ]}
        align="center"
        containerStyle={styles.titleBlock}
        textStyle={styles.titleText}
        rubyStyle={styles.titleRuby}
      />
      <FuriganaText
        segments={[
          seg('一城', 'いちじょう'),
          seg(' から '),
          seg('天下統一', 'てんかとういつ'),
          seg(' を目指', 'をめざ'),
          seg(' す '),
          seg('文字', 'もじ'),
          seg(' 主体', 'しゅたい'),
          seg(' の '),
          seg('SLG'),
        ]}
        align="center"
        containerStyle={styles.subtitleBlock}
        textStyle={styles.subtitleText}
        rubyStyle={styles.smallRuby}
      />

      <ActionButton label={[seg('新規', 'しんき'), seg('ゲーム')]} onPress={startGame} />
      <ActionButton
        label={[seg('ロード')]}
        onPress={() =>
          setGame((current) => ({
            ...current,
            titleNote: [
              seg('ロード', 'ろーど'),
              seg(' は '),
              seg('MVP', 'えむぶいぴー'),
              seg(' では '),
              seg('準備中', 'じゅんびちゅう'),
            ],
          }))
        }
      />

      {game.titleNote ? (
        <View style={styles.noteCard}>
          <FuriganaText segments={game.titleNote} textStyle={styles.noteText} rubyStyle={styles.smallRuby} />
        </View>
      ) : null}
    </View>
  );

  const renderDomesticTab = () => (
    <View style={styles.section}>
      <ActionButton label={[seg('税', 'ぜい'), seg(' を増', 'をふ'), seg(' やす')]} onPress={() => handleDomestic('tax')} />
      <ActionButton label={[seg('農業', 'のうぎょう'), seg(' を '), seg('奨励', 'しょうれい')]} onPress={() => handleDomestic('farm')} />
      <ActionButton label={[seg('城防', 'じょうぼう'), seg(' を固', 'をかた'), seg(' める')]} onPress={() => handleDomestic('fortify')} />
      <ActionButton label={[seg('兵', 'へい'), seg(' を '), seg('募集', 'ぼしゅう')]} onPress={() => handleDomestic('recruit')} />
      <ActionButton label={[seg('兵科', 'へいか'), seg(' を選', 'をえら'), seg(' ぶ')]} onPress={() => handleDomestic('arms')} />
    </View>
  );

  const renderMilitaryTab = () => (
    <View style={styles.section}>
      <View style={styles.tipCard}>
        <FuriganaText
          segments={[seg('大軍', 'たいぐん'), seg(' を整', 'をととの'), seg(' え '), seg('隣接城', 'りんせつじょう'), seg(' を攻撃', 'をこうげき'), seg(' します')]}
          textStyle={styles.noteText}
          rubyStyle={styles.smallRuby}
        />
      </View>
      {adjacentTargets.map((city) => (
        <ActionButton
          key={city.id}
          label={[seg(city.name, city.ruby), seg(' を '), seg('攻撃', 'こうげき')]}
          onPress={() => handleAttack(city.id)}
        />
      ))}
      {adjacentTargets.length === 0 ? (
        <View style={styles.tipCard}>
          <FuriganaText
            segments={[seg('攻撃', 'こうげき'), seg(' 可能', 'かのう'), seg(' な '), seg('隣接城', 'りんせつじょう'), seg(' はありません')]}
            textStyle={styles.noteText}
            rubyStyle={styles.smallRuby}
          />
        </View>
      ) : null}
    </View>
  );

  const renderDiplomacyTab = () => (
    <View style={styles.section}>
      <ActionButton label={[seg('結盟', 'けつめい'), seg(' を申し込', 'をもうしこ'), seg(' む')]} onPress={() => handleDiplomacy('alliance')} />
      <ActionButton label={[seg('離間', 'りかん')]} onPress={() => handleDiplomacy('discord')} />
      <ActionButton label={[seg('買収', 'ばいしゅう')]} onPress={() => handleDiplomacy('buyoff')} />
      <ActionButton label={[seg('婿取', 'むこと'), seg(' り')]} onPress={() => handleDiplomacy('marriage')} />
    </View>
  );

  const renderOfficerTab = () => (
    <View style={styles.section}>
      {game.officers.map((officer) => (
        <View key={officer.name} style={styles.listCard}>
          <FuriganaText
            segments={[seg('姓名', 'せいめい'), seg(': '), seg(officer.name, officer.ruby)]}
            textStyle={styles.cardTitle}
            rubyStyle={styles.smallRuby}
          />
          <FuriganaText
            segments={[
              seg('勢力', 'せいりょく'),
              seg(': '),
              seg(officer.faction, officer.factionRuby),
              seg('　'),
              seg('忠誠度', 'ちゅうせいど'),
              seg(': '),
              seg(String(officer.loyalty)),
            ]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
          <FuriganaText
            segments={[
              seg('統率', 'とうそつ'),
              seg(': '),
              seg(String(officer.leadership)),
              seg('　'),
              seg('武力', 'ぶりょく'),
              seg(': '),
              seg(String(officer.might)),
              seg('　'),
              seg('智力', 'ちりょく'),
              seg(': '),
              seg(String(officer.intellect)),
            ]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
          <FuriganaText
            segments={[
              seg('政治', 'せいじ'),
              seg(': '),
              seg(String(officer.politics)),
              seg('　'),
              seg('魅力', 'みりょく'),
              seg(': '),
              seg(String(officer.charm)),
            ]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
        </View>
      ))}

      {game.reserveOfficer ? (
        <ActionButton
          label={[seg('在野武将', 'ざいやぶしょう'), seg(' を '), seg('勧誘', 'かんゆう')]}
          onPress={recruitOfficer}
        />
      ) : null}
    </View>
  );

  const renderCitiesTab = () => (
    <View style={styles.section}>
      {visibleCities.map((city) => (
        <View key={city.id} style={styles.listCard}>
          <FuriganaText
            segments={[
              seg(city.name, city.ruby),
              seg(' '),
              seg(city.faction, city.factionRuby),
              seg(' '),
              seg('兵力', 'へいりょく'),
              seg(': '),
              seg(`${(city.troops / 10000).toFixed(1)}万`, 'まん'),
            ]}
            textStyle={styles.cardTitle}
            rubyStyle={styles.smallRuby}
          />
          <FuriganaText
            segments={[seg('城防', 'じょうぼう'), seg(': '), seg(String(city.defense))]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
          {city.faction !== playerFaction.name ? (
            <View style={styles.inlineActions}>
              <ActionButton label={[seg('攻撃', 'こうげき')]} onPress={() => handleAttack(city.id)} />
              <ActionButton label={[seg('結盟', 'けつめい')]} onPress={() => handleDiplomacy('alliance')} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (game.selectedTab) {
      case 'domestic':
        return renderDomesticTab();
      case 'military':
        return renderMilitaryTab();
      case 'diplomacy':
        return renderDiplomacyTab();
      case 'officers':
        return renderOfficerTab();
      case 'cities':
        return renderCitiesTab();
      default:
        return null;
    }
  };

  if (!game.started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent}>{renderTitle()}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <FuriganaText
            segments={[seg(`第${game.year}年`, yearRuby(game.year)), seg(' '), seg(seasonLabels[game.seasonIndex].base, seasonLabels[game.seasonIndex].ruby)]}
            textStyle={styles.headerTitle}
            rubyStyle={styles.headerRuby}
          />
          <FuriganaText
            segments={[seg('所属城', 'しょぞくじょう'), seg(': '), seg(homeCity?.name ?? '滅亡', homeCity?.ruby)]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
          <FuriganaText
            segments={[seg('主目標', 'しゅもくひょう'), seg(': '), seg('天下統一', 'てんかとういつ')]}
            rubyStyle={styles.smallRuby}
            textStyle={styles.cardText}
          />
          {game.victory ? (
            <View style={styles.victoryBanner}>
              <FuriganaText
                segments={[seg('天下統一', 'てんかとういつ'), seg(' 達成', 'たっせい')]}
                align="center"
                textStyle={styles.victoryText}
                rubyStyle={styles.buttonRuby}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.statGrid}>
          <StatCard label={[seg('金', 'きん')]} value={String(game.gold)} />
          <StatCard label={[seg('糧食', 'りょうしょく')]} value={String(game.food)} />
          <StatCard label={[seg('兵力', 'へいりょく')]} value={String(totalTroops)} />
          <StatCard label={[seg('城防', 'じょうぼう')]} value={String(homeCity?.defense ?? 0)} />
        </View>

        <View style={styles.logCard}>
          <FuriganaText
            segments={[seg('戦報', 'せんぽう'), seg('・'), seg('事件', 'じけん'), seg('ログ')]}
            textStyle={styles.sectionTitle}
            rubyStyle={styles.smallRuby}
          />
          {game.logs.slice().reverse().map((entry) => (
            <View key={entry.id} style={styles.logItem}>
              <FuriganaText segments={entry.segments} rubyStyle={styles.smallRuby} textStyle={styles.logText} />
            </View>
          ))}
        </View>

        <View style={styles.tabRow}>
          {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
            <ActionButton
              key={tab}
              label={tabLabels[tab]}
              active={game.selectedTab === tab}
              onPress={() => setGame((current) => ({ ...current, selectedTab: tab }))}
            />
          ))}
        </View>

        {renderTabContent()}

        <ActionButton label={[seg('ターン', 'たーん'), seg('終了', 'しゅうりょう')]} onPress={endTurn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5efe3',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  titleScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 48,
  },
  titleBlock: {
    paddingVertical: 16,
  },
  titleText: {
    fontSize: 28,
    lineHeight: 34,
    color: '#5f3315',
    fontWeight: '800',
  },
  titleRuby: {
    fontSize: 12,
    lineHeight: 14,
    color: '#9b6a44',
  },
  subtitleBlock: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#4f3a22',
  },
  headerCard: {
    backgroundColor: '#fffaf2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e7dac4',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: '#4c2508',
    fontWeight: '800',
  },
  headerRuby: {
    fontSize: 11,
    lineHeight: 13,
    color: '#956644',
  },
  button: {
    backgroundColor: '#7e4a24',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#6a3c1b',
  },
  buttonActive: {
    backgroundColor: '#a05e2e',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff7ea',
    fontSize: 15,
    lineHeight: 20,
  },
  buttonRuby: {
    color: '#fde5c3',
    fontSize: 10,
    lineHeight: 12,
  },
  section: {
    backgroundColor: '#fffaf2',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e7dac4',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#53301a',
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fffaf2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eadbc2',
  },
  smallRuby: {
    fontSize: 10,
    lineHeight: 12,
    color: '#927152',
  },
  smallLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#5a3720',
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    color: '#412512',
    fontWeight: '700',
    marginTop: 4,
  },
  logCard: {
    backgroundColor: '#fffaf2',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eadbc2',
    gap: 10,
  },
  logItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#c7905d',
    paddingLeft: 10,
  },
  logText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#47301c',
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipCard: {
    backgroundColor: '#f8efe1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  noteCard: {
    backgroundColor: '#fffaf2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eadbc2',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#53301a',
  },
  listCard: {
    backgroundColor: '#fdf7ee',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eddcc3',
    marginBottom: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#472712',
    fontWeight: '800',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#53301a',
  },
  inlineActions: {
    marginTop: 6,
  },
  victoryBanner: {
    marginTop: 6,
    backgroundColor: '#9c5b2c',
    borderRadius: 14,
    padding: 10,
  },
  victoryText: {
    color: '#fff7ea',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
});
