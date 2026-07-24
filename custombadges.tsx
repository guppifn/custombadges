import { logger } from "@vendetta";
import { findByName, findByProps } from "@vendetta/metro";
import { React, ReactNative } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const { ScrollView, View, Text, TextInput, Image } = ReactNative;
const DEFAULT_BADGES = [
  {
    "key": "6a630b5e30911b68ed77fec1",
    "discordId": "691309479857225750",
    "name": "Bug Hunter Level 2",
    "imageUrl": "https://i.ibb.co/S7RTLWYf/IMG-8960.gif",
    "tooltip": "Bug Hunter Level 2"
  },
  {
    "key": "6a630b2c91bf29477a77583f",
    "discordId": "691309479857225750",
    "name": "Discord Staff",
    "imageUrl": "https://i.ibb.co/spT3zBWs/IMG-8961.gif",
    "tooltip": "Discord Staff"
  }
];
const useBadgesModule = findByName("useBadges", false);
const jsxRuntime = findByProps("jsx", "jsxs");
const injectedProps = new Map();
let unpatches = [];

const effectiveBadge = (badge) => ({
  ...badge,
  imageUrl: storage.overrides?.[badge.key]?.imageUrl || badge.imageUrl,
  tooltip: storage.overrides?.[badge.key]?.tooltip || badge.tooltip,
});

function Settings() {
  useProxy(storage);
  storage.overrides ??= {};
  return <ScrollView style={{ padding: 16 }}>
    {DEFAULT_BADGES.map((badge) => {
      const current = effectiveBadge(badge);
      const update = (field, value) => storage.overrides[badge.key] = { ...storage.overrides[badge.key], [field]: value };
      return <View key={badge.key} style={{ marginBottom: 20, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image source={{ uri: current.imageUrl }} style={{ width: 20, height: 20, borderRadius: 4 }} resizeMode="contain" />
          <Text style={{ fontWeight: "700" }}>{badge.name} · {badge.discordId}</Text>
        </View>
        <Text>Badge image URL</Text>
        <TextInput value={current.imageUrl} onChangeText={(value) => update("imageUrl", value)} autoCapitalize="none" style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(127,127,127,0.15)" }} />
        <Text>Tooltip</Text>
        <TextInput value={current.tooltip} onChangeText={(value) => update("tooltip", value)} style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(127,127,127,0.15)" }} />
      </View>;
    })}
  </ScrollView>;
}

function patchRenderedBadge([Component], ret) {
  try {
    if (Component?.name !== "RenderedBadge" || !ret?.props?.id) return;
    const props = injectedProps.get(ret.props.id);
    if (props) Object.assign(ret.props, props);
  } catch (error) { logger.error("[CustomBadges] Render patch failed", error); }
}

function installPatches() {
  if (!useBadgesModule?.default || !jsxRuntime?.jsx || !jsxRuntime?.jsxs) throw new Error("Required profile badge modules were not found");
  const renderPatches = [after("jsx", jsxRuntime, patchRenderedBadge), after("jsxs", jsxRuntime, patchRenderedBadge)];
  const badgePatch = after("default", useBadgesModule, ([user], result) => {
    try {
      const userId = user?.userId;
      if (!userId || !Array.isArray(result)) return;
      DEFAULT_BADGES.filter((badge) => badge.discordId === userId).forEach((raw, index) => {
        const badge = effectiveBadge(raw);
        if (!badge.imageUrl) return;
        const id = `custom-badge-${userId}-${index}`;
        if (result.some((item) => item?.id === id)) return;
        injectedProps.set(id, { source: { uri: badge.imageUrl }, id, label: badge.tooltip, resizeMode: "contain", style: { width: 20, height: 20, borderRadius: 4 } });
        result.push({ id, description: badge.tooltip, icon: "_" });
      });
    } catch (error) { logger.error("[CustomBadges] Badge injection failed", error); }
  });
  return [...renderPatches, badgePatch];
}

export default {
  onLoad() {
    try { storage.overrides ??= {}; unpatches = installPatches(); }
    catch (error) { logger.error("[CustomBadges] Failed to load", error); this.onUnload(); }
  },
  onUnload() {
    for (const unpatch of unpatches.splice(0)) { try { unpatch?.(); } catch (error) { logger.error("[CustomBadges] Failed to unpatch", error); } }
    injectedProps.clear();
  },
  settings: Settings,
};
