const { logger } = vendetta;
const { findByName, findByProps } = vendetta.metro;
const { React, ReactNative } = vendetta.metro.common;
const { after } = vendetta.patcher;
const { storage } = vendetta.plugin;
const { useProxy } = vendetta.storage;

const { ScrollView, View, Text, TextInput, Image, TouchableOpacity } = ReactNative;

const DEFAULT_BADGES = [
  {
    key: "6a630b5e30911b68ed77fec1",
    discordId: "691309479857225750",
    name: "Bug Hunter Level 2",
    imageUrl: "https://i.ibb.co/S7RTLWYf/IMG-8960.gif",
    tooltip: "Bug Hunter Level 2"
  },
  {
    key: "6a630b2c91bf29477a77583f",
    discordId: "691309479857225750",
    name: "Discord Staff",
    imageUrl: "https://i.ibb.co/spT3zBWs/IMG-8961.gif",
    tooltip: "Discord Staff"
  }
];

const useBadgesModule = findByName("useBadges", false);
const jsxRuntime = findByProps("jsx", "jsxs");
const injectedProps = new Map();
let unpatches = [];

function Settings() {
  useProxy(storage);
  
  // Ensure array structure in storage
  storage.badges ??= [...DEFAULT_BADGES];

  // State for the "Add New Badge" form inputs
  const [newDiscordId, setNewDiscordId] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [newTooltip, setNewTooltip] = React.useState("");

  const handleAddBadge = () => {
    if (!newDiscordId || !newImageUrl) return;

    const newBadge = {
      key: Date.now().toString(),
      discordId: newDiscordId.trim(),
      name: newName.trim() || "Custom Badge",
      imageUrl: newImageUrl.trim(),
      tooltip: newTooltip.trim() || newName.trim() || "Custom Badge"
    };

    storage.badges = [...storage.badges, newBadge];

    // Reset Form
    setNewDiscordId("");
    setNewName("");
    setNewImageUrl("");
    setNewTooltip("");
  };

  const handleRemoveBadge = (key) => {
    storage.badges = storage.badges.filter((b) => b.key !== key);
  };

  const handleUpdateBadge = (key, field, value) => {
    storage.badges = storage.badges.map((badge) => {
      if (badge.key === key) {
        return { ...badge, [field]: value };
      }
      return badge;
    });
  };

  const inputStyle = {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(127,127,127,0.15)",
    color: "#FFFFFF",
    marginBottom: 8
  };

  const labelStyle = {
    color: "#B5BAC1",
    marginBottom: 4,
    fontSize: 12
  };

  return React.createElement(
    ScrollView,
    { style: { padding: 16 } },
    
    // --- ADD BADGE SECTION ---
    React.createElement(
      View,
      {
        style: {
          backgroundColor: "rgba(0,0,0,0.2)",
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1
        }
      },
      React.createElement(
        Text,
        { style: { fontWeight: "700", color: "#FFFFFF", fontSize: 16, marginBottom: 12 } },
        "Add New Badge"
      ),
      React.createElement(Text, { style: labelStyle }, "Discord User ID *"),
      React.createElement(TextInput, {
        value: newDiscordId,
        onChangeText: setNewDiscordId,
        placeholder: "e.g. 691309479857225750",
        placeholderTextColor: "#6D6F78",
        style: inputStyle
      }),
      React.createElement(Text, { style: labelStyle }, "Badge Name"),
      React.createElement(TextInput, {
        value: newName,
        onChangeText: setNewName,
        placeholder: "e.g. Staff Badge",
        placeholderTextColor: "#6D6F78",
        style: inputStyle
      }),
      React.createElement(Text, { style: labelStyle }, "Image URL *"),
      React.createElement(TextInput, {
        value: newImageUrl,
        onChangeText: setNewImageUrl,
        autoCapitalize: "none",
        placeholder: "https://...",
        placeholderTextColor: "#6D6F78",
        style: inputStyle
      }),
      React.createElement(Text, { style: labelStyle }, "Tooltip Text"),
      React.createElement(TextInput, {
        value: newTooltip,
        onChangeText: setNewTooltip,
        placeholder: "Hover text...",
        placeholderTextColor: "#6D6F78",
        style: inputStyle
      }),
      React.createElement(
        TouchableOpacity,
        {
          onPress: handleAddBadge,
          style: {
            backgroundColor: "#5865F2",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 4
          }
        },
        React.createElement(
          Text,
          { style: { color: "#FFFFFF", fontWeight: "600" } },
          "Add Badge"
        )
      )
    ),

    // --- BADGE LIST SECTION ---
    React.createElement(
      Text,
      { style: { fontWeight: "700", color: "#FFFFFF", fontSize: 16, marginBottom: 12 } },
      `Active Badges (${storage.badges.length})`
    ),

    storage.badges.map((badge) =>
      React.createElement(
        View,
        {
          key: badge.key,
          style: {
            marginBottom: 20,
            padding: 12,
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: 8
          }
        },
        React.createElement(
          View,
          { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
          React.createElement(
            View,
            { style: { flexDirection: "row", alignItems: "center" } },
            React.createElement(Image, {
              source: { uri: badge.imageUrl },
              style: { width: 20, height: 20, borderRadius: 4, marginRight: 8 },
              resizeMode: "contain"
            }),
            React.createElement(
              Text,
              { style: { fontWeight: "700", color: "#FFFFFF" } },
              `${badge.name || "Badge"} · ${badge.discordId}`
            )
          ),
          React.createElement(
            TouchableOpacity,
            {
              onPress: () => handleRemoveBadge(badge.key),
              style: {
                backgroundColor: "#DA373C",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6
              }
            },
            React.createElement(Text, { style: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" } }, "Delete")
          )
        ),
        React.createElement(Text, { style: labelStyle }, "Badge Image URL"),
        React.createElement(TextInput, {
          value: badge.imageUrl,
          onChangeText: (value) => handleUpdateBadge(badge.key, "imageUrl", value),
          autoCapitalize: "none",
          style: inputStyle
        }),
        React.createElement(Text, { style: labelStyle }, "Tooltip"),
        React.createElement(TextInput, {
          value: badge.tooltip,
          onChangeText: (value) => handleUpdateBadge(badge.key, "tooltip", value),
          style: inputStyle
        })
      )
    )
  );
}

function patchRenderedBadge([Component], ret) {
  try {
    if (Component?.name !== "RenderedBadge" || !ret?.props?.id) return;
    const props = injectedProps.get(ret.props.id);
    if (props) Object.assign(ret.props, props);
  } catch (error) {
    logger.error("[CustomBadges] Render patch failed", error);
  }
}

function installPatches() {
  if (!useBadgesModule?.default || !jsxRuntime?.jsx || !jsxRuntime?.jsxs) {
    throw new Error("Required profile badge modules were not found");
  }

  const renderPatches = [
    after("jsx", jsxRuntime, patchRenderedBadge),
    after("jsxs", jsxRuntime, patchRenderedBadge)
  ];

  const badgePatch = after("default", useBadgesModule, ([user], result) => {
    try {
      const userId = user?.userId;
      if (!userId || !Array.isArray(result)) return;

      const activeBadges = storage.badges || DEFAULT_BADGES;

      activeBadges
        .filter((badge) => badge.discordId === userId)
        .forEach((badge, index) => {
          if (!badge.imageUrl) return;

          const id = `custom-badge-${userId}-${badge.key || index}`;
          if (result.some((item) => item?.id === id)) return;

          injectedProps.set(id, {
            source: { uri: badge.imageUrl },
            id,
            label: badge.tooltip,
            resizeMode: "contain",
            style: { width: 20, height: 20, borderRadius: 4 }
          });

          result.push({ id, description: badge.tooltip, icon: "_" });
        });
    } catch (error) {
      logger.error("[CustomBadges] Badge injection failed", error);
    }
  });

  return [...renderPatches, badgePatch];
}

module.exports = {
  onLoad() {
    try {
      storage.badges ??= [...DEFAULT_BADGES];
      unpatches = installPatches();
    } catch (error) {
      logger.error("[CustomBadges] Failed to load", error);
      this.onUnload();
    }
  },
  onUnload() {
    for (const unpatch of unpatches.splice(0)) {
      try {
        unpatch?.();
      } catch (error) {
        logger.error("[CustomBadges] Failed to unpatch", error);
      }
    }
    injectedProps.clear();
  },
  settings: Settings
};
