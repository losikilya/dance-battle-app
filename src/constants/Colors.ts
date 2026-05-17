const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#000",
    background: "#0B0C0E",
    backgroundLight: "#13131C",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
  },
  primary: {
    contrastText: "#000",
    dark: "#004e60",
    light: "#4cd6ff",
    main: "#4cd6ff",
  },
  secondary: {
    contrastText: "#75B3FF",
    dark: "#d05bff",
    light: "#ffdad6",
    main: "#ecb1ff",
  },
  text: {
    disabled: "rgba(146, 152, 170, 0.5)",
    hint: "#92929D",
    primary: "#ffffff",
    secondary: "#8789A6",
    placeholder: "rgba(255,255,255,0.45)",
    error: "#F54342",
  },
  error: {
    contrastText: "#000",
    dark: "#FB3F3F",
    light: "#FD7575",
    main: "#FC5A5A",
  },
};
