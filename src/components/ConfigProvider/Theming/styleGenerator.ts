import {
    IGetStyle,
    IRegisterTheme,
    OcTheme,
    OcThemeNames,
    ThemeName,
    ThemeOptions,
    Variables,
} from './Theming.types';
import { TinyColor } from '@ctrl/tinycolor';
import generate from './generate';
import OcThemes, { themeDefaults } from './themes';

const THEME_CONTAINER_ID = 'octuple-theme';

interface Options {
    attachTo?: Element;
    csp?: { nonce?: string };
    prepend?: boolean;
    mark?: string;
}

export function getStyle(themeOptions: ThemeOptions): IGetStyle {
    const variables: Variables = {};

    const fillColor = (
        colorPalettes: string[],
        type: string
    ): Record<string, string> =>
        colorPalettes.reduce((acc, color, index) => {
            const key: string = `${type}-${(index + 1) * 10}`;
            acc[key] = color;
            return acc;
        }, variables);

    const generatePalette = (colorVal: string, type: string): void => {
        const baseColor = new TinyColor(colorVal);
        const colorPalettes = generate(baseColor.toRgbString(), {});
        fillColor(colorPalettes, type);
    };

    const themeName: ThemeName = themeOptions.name;

    const theme: OcTheme = {
        ...themeDefaults,
        ...OcThemes?.[themeOptions.name as OcThemeNames],
        ...themeOptions.customTheme,
    };

    // ================ Use existing palette ================
    if (theme.palette) {
        fillColor([...theme.palette].reverse(), 'primary-color');
        variables[`primary-color`] = theme.primaryColor;
    }

    // ================ Custom primary palette ================
    if (themeOptions.customTheme?.primaryColor) {
        generatePalette(theme.primaryColor, 'primary-color');
        variables[`primary-color`] = theme.primaryColor;
    }

    // ================ Disruptive palette ================
    if (!theme.disruptiveColor) {
        fillColor([...OcThemes.red.palette].reverse(), 'disruptive-color');
        variables[`disruptive-color`] = OcThemes.red.primaryColor;
    } else {
        generatePalette(theme.disruptiveColor, 'disruptive-color');
        variables[`disruptive-color`] = theme.disruptiveColor;
    }

    // ================ Background Color ================
    if (theme.backgroundColor) {
        variables[`background-color`] = theme.backgroundColor;
    }

    const themePrimaryColor: TinyColor = new TinyColor(theme.primaryColor);

    // ================ Text Color ================
    if (theme.textColor) {
        variables[`text-primary-color`] = themePrimaryColor.isDark()
            ? theme.textColor
            : theme.textColorInverse;
    }

    if (theme.textColorSecondary) {
        variables[`text-secondary-color`] = theme.textColorSecondary;
    }

    if (theme.textColorInverse) {
        variables[`text-inverse-color`] = themePrimaryColor.isDark()
            ? theme.textColorInverse
            : theme.textColor;
    }

    // ================ Success Color ================
    if (theme.successColor) {
        variables[`success-color`] = theme.successColor;
    }

    // ================ Warning Color ================
    if (theme.warningColor) {
        variables[`warning-color`] = theme.warningColor;
    }

    // ================= Error Color =================
    if (theme.errorColor) {
        variables[`error-color`] = theme.errorColor;
    }

    // ================= Info Color ==================
    if (theme.infoColor) {
        variables[`info-color`] = theme.infoColor;
    }

    return {
        variables,
        light: themePrimaryColor.isLight(),
        themeName,
    };
}

function getContainer(option: Options): Element {
    if (option.attachTo) {
        return option.attachTo;
    }

    const head = document.querySelector('head');
    return head || document.body;
}

export function injectCSS(
    variables: Variables,
    themeName: string,
    option: Options = {}
): HTMLStyleElement {
    const css = `
          .theme-${themeName} {
            ${Object.keys(variables)
                .map((key) => `--${key}: ${variables[key]};`)
                .join('\n')}
          }
          `.trim();
    const styleNode: HTMLStyleElement =
        (document.getElementById(THEME_CONTAINER_ID) as HTMLStyleElement) ||
        document.createElement('style');
    styleNode.id = THEME_CONTAINER_ID;
    if (option.csp?.nonce) {
        styleNode.nonce = option.csp?.nonce;
    }
    styleNode.innerHTML = css;

    const container: Element = getContainer(option);
    const { firstChild } = container;

    if (option.prepend && container.prepend) {
        // Use `prepend` first
        container.prepend(styleNode);
    } else if (option.prepend && firstChild) {
        // Fallback to `insertBefore` like IE not support `prepend`
        container.insertBefore(styleNode, firstChild);
    } else {
        container.appendChild(styleNode);
    }

    return styleNode;
}

export function registerTheme(themeOptions: ThemeOptions): IRegisterTheme {
    const { themeName, light, variables } = getStyle(themeOptions);
    const styleNode: HTMLStyleElement = injectCSS(variables, themeName);
    return {
        themeName,
        light,
        variables,
        styleNode,
    };
}
