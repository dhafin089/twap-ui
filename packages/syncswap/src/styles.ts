import { Button, styled } from "@mui/material";
import { Components, Styles } from "@orbs-network/twap-ui";
import { SyncSwapPallete } from "./types";

const getButtonStyles = (theme: SyncSwapPallete) => {
  return {
    height: 44,
    width: "100%!important",
    borderRadius: 10,
    background: theme.secondary,
    color: "white",
    fontWeight: `500!important`,
    fontSize: 15,
    boxShadow: "rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px",
    "& *": {
      color: "inherit",
      fontWeight: 500,
      fontSize: "inherit",
    },
  };
};

const cardStyles = (pallete: SyncSwapPallete) => ({
  padding: "10px 14px",
  background: hexToRGB(pallete.overlay, 0.7),
  borderRadius: 10,
  boxShadow: "0 0 6px rgb(0 0 0/4%), 0 14px 20px rgb(0 0 0/1%), 0 20px 28px rgb(0 0 0/1%)",
});

export const StyledPoweredBy = styled(Components.PoweredBy)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  color: pallete.primary,
}));

export const StyledSubmitButton = styled(Button)({
  borderRadius: 10,
  textTransform: "none",
  ".MuiCircularProgress-root": {
    position: "absolute",
    maxWidth: 25,
    maxHeight: 25,
  },
});

export const StyledTokenPanel = styled(Components.Base.Card)({
  padding: "1rem 14px",
});

export const StyledChunkSize = styled(Styles.StyledRowFlex)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  justifyContent: "space-between",
  ".twap-usd": {
    color: pallete.info,
  },
}));

export const StyledLimitPrice = styled(Components.Base.Card)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  ".twap-limit-price-input": {
    paddingLeft: 0,
    input: {
      fontSize: 17,
      borderBottom: `1px solid ${pallete.primary}`,
      borderRadius: 0,
    },
  },
  ".twap-token-display": {
    display: "flex",
    alignItems: "center",
  },
  ".twap-token-name": {
    top: 0,
  },
}));

export const StyledMarketPrice = styled(Components.Base.Card)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  display: "flex",
  gap: 5,
  padding: 0,
  button: {
    padding: "10px 14px",
    width: "100%",
    justifyContent: "flex-start",
    gap: 5,
  },
  ".MuiSkeleton-root": {
    maxWidth: 200,
  },
  img: {
    width: 18,
    height: 18,
  },
  p: {
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "400!important",
    color: pallete.normal,
    span: {
      fontSize: "13px",
    },
  },
  ".right-token": {
    fontSize: "13px!important",
    display: "flex",
    alignItems: "center",
    color: pallete.normal,
  },
}));

export const StyledChangeTokensOrder = styled(Components.ChangeTokensOrder)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  height: 12,
  ".twap-icon-btn": {
    padding: 0,
    background: pallete.overlay2,
    overflow: "hidden",
    width: 34,
    height: 34,
    border: `4px solid ${pallete.overlay}`,
    transition: "0.2s all",
    svg: {
      color: pallete.primary,
      width: 14,
      transition: "0.2s all",
    },
    "&:hover": {
      background: pallete.overlay,
      svg: {
        transform: "rotateZ(180deg)",
      },
    },
  },
}));

export const StyledTokenPanelUSD = styled(Components.TokenUSD)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  color: pallete.info,
  fontWeight: 400,
  fontSize: 13,
}));

export const StyledBalance = styled(Components.TokenBalance)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  color: pallete.info,
  fontSize: 13,
  fontWeight: 500,
}));

export const StyledTokenSelect = styled(Button)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  borderRadius: 16,
  minWidth: 110,
  padding: "0 10px",
  height: 38,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "rgb(0 0 0 / 8%) 0 6px 18px",
  background: pallete.overlay,

  ".twap-token-logo": {
    width: 26,
    height: 26,
  },
  svg: {
    color: pallete.info,
    width: 17,
  },
  p: {
    fontSize: 17,
    fontWeight: 500,
    color: pallete.normal,
  },
  "&:hover": {},
}));

export const StyledTokenPanelInput = styled(Components.TokenInput)(({ pallete }: { pallete: SyncSwapPallete }) => ({
  textAlign: "left",
  input: {
    fontSize: 28,
    color: pallete.normal,
    fontWeight: 500,
  },
}));

export const StyledPercentSelect = styled(Styles.StyledRowFlex)({
  width: "100%",
  justifyContent: "space-between",
  button: {
    borderRadius: 10,
  },
});

export function hexToRGB(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const configureStyles = (pallete: SyncSwapPallete) => {
  return {
    ".twap-loader": {
      opacity: "1!important",
    },
    ".twap-input": {
      "& input": {
        fontFamily: "inherit",
        textIndent: 0,
        outline: "1px solid transparent",
        borderRadius: "0.375rem",
        transition: "0.15s all",
        height: 35,
        color: pallete.normal,
        paddingRight: 0,
        "&::placeholder": {
          opacity: 0.5,
        },
      },
    },
    ".twap-odnp-button": {
      ...getButtonStyles(pallete),
      height: "unset",
      width: "auto",
      border: "unset",
      color: "white!important",
    },
    ".twap-trade-size": {
      paddingTop: "8px!important",
      paddingBottom: "17px!important",
      p: {
        fontSize: "14px!important",
      },
      ".twap-token-logo": {
        width: 18,
        height: 18,
      },
      ".twap-token-name": {
        fontSize: "13px!important",
        fontWeight: "400!important",
      },
      input: {
        textAlign: "center!important",
        fontSize: "14px!important",
        borderBottom: `1px solid ${pallete.primary}`,
        borderRadius: 0,
        height: 25,
      },
      ".twap-label": {
        fontSize: "14px",
      },
      ".MuiSlider-valueLabel": {
        background: pallete.secondary,
      },
      ".MuiSlider-thumb": {
        background: "white",
      },
      ".MuiSlider-rail": {
        color: pallete.primary,
      },
      ".MuiSlider-track": {
        color: pallete.background,
      },
    },
    ".twap-warning": {
      fontSize: 14,
      color: "white",
      opacity: 0.5,
    },

    ".twap-limit-price": {
      ".twap-label": {
        fontSize: 14,
      },
    },
    ".twap-input-loader": {
      right: 0,
      left: "unset",
    },
    ".twap-label": {
      fontSize: 16,
    },

    ".twap-icon": {},
    ".twap-tooltip": {
      "& .MuiTooltip-tooltip": {
        borderRadius: 10,
        fontFamily: "inherit",
        lineHeight: 1.5,
        maxWidth: 400,
        padding: 9,
        fontSize: 13,
        "& *": {
          fontSize: "inherit",
        },
      },
    },

    ".twap-button-loader": {},
    ".twap-time-selector": {
      "& input": {
        fontSize: "17px!important",
        borderBottom: `1px solid ${pallete.primary}`,
        borderRadius: 0,
        maxWidth: 80,
        marginLeft: "auto",
        "&::placeholder": {
          color: `${pallete.normal}!important`,
        },
      },
    },
    ".twap-time-selector-list": {
      right: 0,
      background: pallete.overlay,
      borderRadius: 10,
      boxShadow: "0 0 6px rgb(0 0 0/4%), 0 14px 20px rgb(0 0 0/1%), 0 20px 28px rgb(0 0 0/1%)",
      ".twap-time-selector-list-item": {
        "&:hover": {
          background: hexToRGB(pallete.overlay2, 0.7),
        },
      },
    },
    ".twap-time-selector-selected": {
      color: pallete.normal,
    },
    ".twap-card": {
      ...cardStyles(pallete),
    },
    ".twap-container": {
      padding: 0,
      width: "100%",
      fontWeight: 500,
      "*": {
        fontFamily: "inherit!important",
        fontWeight: "inherit!important",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      },
    },
    ".twap-small-label": {
      fontSize: 14,
      fontWeight: "500!important",
    },
    ".twap-slider": {},
    ".twap-change-order": {
      width: 50,
      height: 50,
    },
    ".twap-token-name": {
      fontSize: 18,
    },
    ".twap-token-logo": {
      width: 25,
      height: 25,
    },
    ".twap-order-expanded": {
      padding: "0px 26px",
      ".twap-market-price-section": {
        p: {
          fontSize: "13px!important",
          lineHeight: 2,
        },
        ".twap-small-label p": {
          fontSize: "14px!important",
          fontWeight: "500!important",
        },
      },
      ".twap-order-expanded-cancel-wraper": {
        width: "100%",
        display: "flex",
        justifyContent: "center",
      },
      ".twap-button": {
        margin: "15px auto",
        width: 160,
        maxWidth: 160,
        height: 40,
        border: "1px solid #636679",
      },
      ".twap-order-expanded-colored": {
        ".twap-token-display-amount-and-symbol": {
          fontSize: "16px!important",
        },
        ".twap-order-token-display-usd": {
          p: {
            fontSize: 13,
            span: {
              fontSize: 13,
            },
          },
        },
        ".twap-order-main-progress-bar": {
          borderRadius: 0,
          height: "16px!important",
        },
        ".MuiLinearProgress-bar": {
          borderRadius: 0,
          height: "16px!important",
        },
        ".twap-order-token-display": {
          ".twap-token-logo": {
            width: 25,
            height: 25,
          },
        },
      },
      display: "block!important",
      paddingTop: "0!important",
    },

    ".twap-extended-order-info": {
      paddingBottom: 26,
    },
    ".twap-order": {
      padding: "0px",
      border: "unset",
      color: `${pallete.info}!important`,
      ".twap-order-expanded-colored": {
        padding: "15px 26px",
        ".twap-order-expanded-colored-title": {
          fontSize: 16,
        },
        ".twap-order-expanded-title": {
          fontSize: 14,
        },
        ".twap-token-display-amount-and-symbol": {
          "p, span": {
            fontSize: 16,
            fontWeight: "400!important",
          },
        },
      },
      ".twap-order-main-progress-bar": {
        height: 8,
      },
      "& .twap-order-progress": {
        height: 8,
      },
      "& .MuiLinearProgress-root": {
        "&::after": {
          background: pallete.normal,
        },
      },
      "& .MuiLinearProgress-bar": {
        height: "8px!important",
        background: pallete.primary,
      },
    },
    ".twap-chunks-size": {
      ".twap-token-logo": {
        width: 20,
        height: 20,
      },
    },
    ".twap-orders-empty-list": {
      color: pallete.primary,
    },
    ".twap-orders-header": {
      "& .twap-orders-header-tabs": {
        display: "flex",
        justifyContent: "space-between",
        marginTop: 2,
        border: "none",
        minHeight: 38,
        maxHeight: 38,
        alignItems: "center",

        "& .twap-orders-header-tabs-tab": {
          display: "flex",
          alignItems: "center",
          lineHeight: "normal",
          borderRadius: 0,
          borderBottom: `2px solid transparent`,
          transition: "0s",
          width: "auto",
          padding: "0 10px",
        },
        ".MuiTouchRipple-root": {
          display: "none",
        },
        "& .MuiTabs-indicator": {
          display: "none",
        },
        "& .MuiButtonBase-root": {
          fontWeight: 400,
        },
        "& .Mui-selected": {
          minHeight: 38,
          maxHeight: 38,
          borderRadius: 0,
          borderBottom: `2px solid ${pallete.primary}`,
        },
        "& .MuiTabs-flexContainer": {
          height: 38,
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
    },
    ".twap-button": {
      ...getButtonStyles(pallete),
    },
    ".twap-modal-content": {
      fontSize: "14px",
      fontFamily: "Inter",
      padding: "40px 20px 20px 20px",
      boxSizing: "border-box",
      background: pallete.overlay2,
      borderRadius: "10px",

      ".twap-orders-summary-token-display": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        ".twap-token-logo": {
          width: 30,
          height: 30,
        },
        ".twap-orders-summary-token-display-amount": {
          fontSize: 16,
        },
      },
      ".twap-order-summary-details-item": {
        div: {
          fontSize: 14,
        },
        ".twap-label": {
          fontSize: 14,
        },
      },
      ".twap-disclaimer-text p, .twap-disclaimer-text a": {
        fontSize: "14px",
      },
      maxHeight: "85vh",
      overflow: "auto",
      paddingTop: 50,

      "& a": {
        fontWeight: 500,
        textDecoration: "underline",
        color: pallete.primary,
      },
      "& *": {
        fontFamily: "inherit",
      },
      ".twap-order-summary-limit-price": {
        ...cardStyles(pallete),
        ".twap-label": {
          fontSize: 14,
        },
      },
    },
    ".twap-powered-by": {
      marginTop: "24px!important",
      marginBottom: "0px!important",
      p: {
        fontSize: "11px!important",
        fontWeight: "400!important",
      },
      img: {
        width: "18px!important",
        height: "18px!important",
      },
    },

    ".adapter-wrapper": {
      padding: "0px",
      width: "100%!important",
      maxWidth: "100%!important",
      margin: "auto",
      fontFamily: "Inter",
    },
    ".twap-max-duration-wrapper, .twap-trade-interval-wrapper": {
      ".twap-label": {
        fontSize: 14,
        fontWeight: 500,
      },
    },
    ".twap-label-tooltip-content svg": {
      width: "15px!important",
      height: "15px!important",
    },

    ".twap-order-preview": {
      padding: "15px 26px",
    },
    ".twap-order-preview-header": {
      p: {
        color: `${pallete.primary}!important`,
        fontWeight: 500,
      },
    },
    ".twap-order-preview-info": {
      p: {
        fontSize: 16,
      },
    },

    ".twap-order-separator": {
      display: "none",
    },

    ".twap-limit-price .twap-label": {
      height: 38,
    },
    ".MuiBackdrop-root": {
      backdropFilter: "blur(15px)",
      background: "rgba(0,0,0,.4)!important",
    },
    "@media(max-width:450px)": {
      ".twap-market-price": {
        display: "flex",
        flexDirection: "column",
      },
      ".twap-limit-price-input": {
        ".twap-token-display img": {
          display: "none",
        },
      },
      ".twap-trade-size": {
        ".twap-chunks-size": {
          display: "flex",
          flexDirection: "column",
        },
      },
    },
  };
};