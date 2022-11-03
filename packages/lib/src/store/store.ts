import _ from "lodash";
import { Abi, account as candiesAccount, BigNumber, contract, convertDecimals, eqIgnoreCase, erc20, iwethabi, parsebn, setWeb3Instance, Token, zero } from "@defi.org/web3-candies";
import { useMutation, useQuery } from "react-query";
import { useContext, useMemo, useState } from "react";
import Web3 from "web3";
import { Store, TokenInfo, Translations, Web3State } from "../types";
import create from "zustand";
import { TimeFormat } from "./TimeFormat";
import { getConfig, nativeAddresses } from "../consts";
import { changeNetwork } from "./connect";
import { TwapContext } from "../context";
import moment from "moment";
import twapAbi from "./twap-abi.json";
import { txHandler, useTwapTranslations } from "..";
import { useOrders } from "./orders";

const defaultState = {
  srcTokenInfo: undefined,
  srcToken: undefined,
  srcTokenAmount: undefined,
  dstTokenInfo: undefined,
  dstToken: undefined,
  maxDurationMillis: 0,
  maxDurationTimeFormat: TimeFormat.Minutes,
  tradeIntervalMillis: 0,
  tradeIntervalTimeFormat: TimeFormat.Minutes,
  deadline: undefined,
  customInterval: false,
  limitPrice: undefined,
  isLimitOrder: false,
  totalTrades: 1,
  showConfirmation: false,
  disclaimerAccepted: false,
  customTradeIntervalMillis: 0,
  customTradeIntervalTimeFormat: TimeFormat.Minutes,
};

export const useStore = create<Store>((set, get) => ({
  ...defaultState,
  switchTokens: (dstTokenAmount) => {
    const src = get().srcTokenInfo;
    const dst = get().dstTokenInfo;
    get().setSrcToken(dst, dstTokenAmount);
    get().setDstToken(src);
  },
  setShowConfirmation: (showConfirmation) => {
    set({ showConfirmation });
    if (!showConfirmation) {
      set({ disclaimerAccepted: false });
    }
  },
  setDisclaimerAccepted: (disclaimerAccepted) => set({ disclaimerAccepted }),
  setSrcToken: async (srcTokenInfo, srcTokenAmount) => {
    const srcToken = getToken(srcTokenInfo);
    set({ srcTokenInfo, srcToken, srcTokenAmount, totalTrades: 1 });
    get().resetLimitPrice();
  },
  setSrcTokenAmount: (srcTokenAmount) => {
    set({ srcTokenAmount, totalTrades: 1 });
  },
  onSrcTokenChange: async (amountUi: string) => {
    const srcTokenAmount = await getUiAmountToBigNumber(get().srcToken, amountUi);
    set({ srcTokenAmount, totalTrades: 1 });
  },
  setDstToken: (dstTokenInfo) => {
    set({ dstTokenInfo, dstToken: getToken(dstTokenInfo) });
    get().resetLimitPrice();
  },
  onMaxDurationChange: (maxDurationTimeFormat: TimeFormat, maxDurationMillis: number) => {
    set({ maxDurationMillis, maxDurationTimeFormat });
  },
  setCustomInterval: (customInterval) => set({ customInterval }),
  onTradeIntervalChange: (timeFormat: TimeFormat, millis: number) => {
    set({ customTradeIntervalMillis: millis, customTradeIntervalTimeFormat: timeFormat });
  },

  setLimitPrice: (limitPrice) => set({ limitPrice }),
  toggleLimit: (limitPrice) => set({ isLimitOrder: !get().isLimitOrder, limitPrice }),

  hideLimit: () => set({ isLimitOrder: false }),
  onTradeSizeChange: async (totalTrades) => {
    set({ totalTrades });
  },
  resetLimitPrice: () => set({ limitPrice: undefined, isLimitOrder: false }),
  computed: {
    get derivedTradeInterval() {
      if (get().customInterval) {
        return { millis: 0, timeFormat: TimeFormat.Minutes };
      }
      const { derivedMillis: millis, derivedTimeFormat: timeFormat } = getDerivedTradeInterval(get().maxDurationMillis, get().totalTrades || 0);
      return { millis, timeFormat };
    },
    get tradeIntervalMillis() {
      if (get().customInterval) {
        return get().customTradeIntervalMillis;
      }
      return get().computed.derivedTradeInterval.millis;
    },
    get tradeIntervalTimeFormat() {
      if (get().customInterval) {
        return get().customTradeIntervalTimeFormat;
      }
      return get().computed.derivedTradeInterval.timeFormat;
    },
    get tradeSize() {
      if (get().totalTrades === 0) return undefined;
      return get().srcTokenAmount?.div(get().totalTrades);
    },
    get deadline() {
      const now = moment().valueOf();
      return now + moment(get().maxDurationMillis).add(60_000, "milliseconds").valueOf();
    },
    get deadlineUi() {
      if (!get().computed.deadline) return "";
      return moment(get().computed.deadline).format("DD/MM/YYYY HH:mm");
    },
    get minAmountOut() {
      if (!get().isLimitOrder) {
        return BigNumber(1);
      }
      return convertDecimals(get().computed.tradeSize?.times(get().limitPrice || 0) || 0, get().srcTokenInfo?.decimals || 0, get().dstTokenInfo?.decimals || 0);
    },
  },
  reset: () => set(defaultState),
}));

export const useWeb3Store = create<Web3State>((set) => ({
  web3: undefined,
  setWeb3: (web3) => set({ web3 }),
  account: undefined,
  setAccount: (account) => set({ account }),
  chain: undefined,
  setChain: (chain) => set({ chain }),
  integrationChain: undefined,
  integrationKey: undefined,
  setIntegrationChain: (integrationChain) => set({ integrationChain }),
  setIntegrationKey: (integrationKey) => set({ integrationKey }),
}));

const useTokenApproval = () => {
  const { account, chain, config } = useWeb3();
  const { srcToken, srcTokenAmount } = useStore();
  const [waitForApproval, setWaitForApproval] = useState(false);

  const spender = config ? config.twapAddress : undefined;
  const { data: allowance, refetch } = useQuery(["allowance", account, srcToken?.address], async () => BigNumber(await srcToken!.methods.allowance(account!, spender!).call()), {
    enabled: !!account && !!chain && !!spender && !!srcToken && !!srcTokenAmount && !isNativeToken(srcToken.address),
    refetchInterval: 5_000,
  });

  const { mutate: approve, isLoading: approveLoading } = useMutation(async () => {
    const tx = () => {
      return srcToken?.methods.approve(spender!, srcTokenAmount!.toString()).send({ from: account });
    };
    await txHandler(tx);
    await refetch();
    setWaitForApproval(true);
  });

  const isApproved = !srcTokenAmount ? false : allowance?.gte(srcTokenAmount || 0);

  return {
    isApproved,
    approve,
    approveLoading: approveLoading || (waitForApproval && !isApproved),
  };
};

const useWrapToken = () => {
  const { srcTokenAmount, setSrcToken, srcTokenInfo, srcToken, setShowConfirmation } = useStore();
  const { account, config } = useWeb3();
  const { refetch } = useAccountBalances(srcToken);

  const { mutateAsync: wrap, isLoading } = useMutation(async () => {
    const tx = async () => {
      const wToken: any = getToken(config!.wrappedTokenInfo, true);
      await wToken?.methods.deposit().send({ from: account, value: srcTokenAmount!.toString() });
    };
    await txHandler(tx, 4000);
    setSrcToken(config!.wrappedTokenInfo, srcTokenAmount);

    await refetch();
    setShowConfirmation(true);
  });

  return {
    wrap,
    shouldWrap: isNativeToken(srcTokenInfo?.address),
    isLoading,
  };
};

export const useWeb3 = () => {
  const { setWeb3, web3, setAccount, account, setChain, chain, setIntegrationChain, integrationChain, integrationKey, setIntegrationKey } = useWeb3Store();

  const init = async (_integrationKey: string, provider?: any, integrationChainId?: number) => {
    const newWeb3 = provider ? new Web3(provider) : undefined;
    setWeb3(newWeb3);
    setWeb3Instance(newWeb3);
    setAccount(newWeb3 ? await candiesAccount() : undefined);
    setChain(newWeb3 ? await newWeb3.eth.getChainId() : undefined);
    setIntegrationChain(integrationChainId);
    setIntegrationKey(_integrationKey);
  };

  return {
    init,
    web3,
    account,
    chain,
    integrationChain,
    isInvalidChain: chain && chain !== integrationChain,
    changeNetwork: () => changeNetwork(web3, integrationChain),
    config: getConfig(integrationChain || 0, integrationKey || ""),
    ellipsisAccount: makeEllipsisAddress(account),
  };
};

const useAccountBalances = (token?: Token) => {
  const { account, isInvalidChain, web3 } = useWeb3();

  return useQuery(
    ["useAccountBalances", token?.address, account],
    async () => {
      if (isNativeToken(token!.address)) {
        return BigNumber((await web3?.eth.getBalance(account!)) || 0);
      }
      return BigNumber(await token!.methods.balanceOf(account!).call());
    },
    { enabled: !!token && !!account && !isInvalidChain, refetchInterval: 30_000 }
  );
};

const useActionHandlers = () => {
  const { srcToken, onSrcTokenChange } = useStore();
  const { data: balance } = useAccountBalances(srcToken);

  const onChangePercent = async (percent: number) => {
    const value = balance?.multipliedBy(percent) || zero;
    const uiValue = await getBigNumberToUiAmount(srcToken, value);
    onSrcTokenChange(uiValue);
  };

  return { onChangePercent };
};

const useDstTokenAmount = () => {
  const { srcTokenInfo, srcTokenAmount, srcToken, dstTokenInfo, dstToken, limitPrice } = useStore();
  const { data: dstTokenUsdValue18 } = useUsdValue(dstToken);
  const { data: srcTokenUsdValue18 } = useUsdValue(srcToken);

  const srcTokenDecimals = srcTokenInfo?.decimals;
  const dstTokenDecimals = dstTokenInfo?.decimals;

  return useMemo(() => {
    if (!srcTokenAmount || srcTokenAmount.isZero() || !srcToken || !dstToken || !srcTokenDecimals || !dstTokenDecimals) {
      return undefined;
    }
    let res;
    if (limitPrice) {
      res = srcTokenAmount.times(limitPrice);
    } else {
      res = srcTokenAmount.times(srcTokenUsdValue18 || 0).div(dstTokenUsdValue18 || 1);
    }

    return convertDecimals(res, srcTokenDecimals, dstTokenDecimals);
  }, [srcTokenDecimals, dstTokenDecimals, srcTokenAmount, srcToken, dstToken, limitPrice, dstTokenUsdValue18, srcTokenUsdValue18]);
};

/**
 * @returns USD value for 1 whole token (mantissa)
 */
export const useUsdValue = (token?: Token) => {
  const { isInvalidChain, config, web3 } = useWeb3();
  const { getUsdPrice } = useContext(TwapContext);
  return useQuery(
    ["useUsdValue", token?.address],
    async () => {
      const decimals = await token!.decimals();
      const address = isNativeToken(token!.address) ? config?.wrappedTokenInfo.address : token!.address;
      return getUsdPrice(address!, decimals);
    },
    {
      enabled: !!token && !isInvalidChain && !!web3,
      // refetchInterval: 10000
      staleTime: 60_000,
    }
  );
};

// all actions (functions) related to max duration input
const useMaxDuration = () => {
  const {
    maxDurationTimeFormat,
    maxDurationMillis,
    onMaxDurationChange,
    computed: { deadline, deadlineUi },
  } = useStore();

  return {
    onMaxDurationChange,
    maxDurationTimeFormat,
    maxDurationMillis,
    deadline,
    deadlineUi,
  };
};

const useTradeInterval = () => {
  const {
    customInterval,
    setCustomInterval,
    onTradeIntervalChange,
    computed: { tradeIntervalMillis, tradeIntervalTimeFormat },
  } = useStore();

  return {
    tradeIntervalMillis,
    tradeIntervalTimeFormat,
    customInterval,
    onTradeIntervalChange,
    onCustomIntervalClick: () => setCustomInterval(true),
    tradeIntervalUi: useGetTradeIntervalForUi(tradeIntervalMillis),
  };
};

// all data related to trade size input
const useTradeSize = () => {
  const {
    srcToken,
    srcTokenInfo,
    srcTokenAmount,
    onTradeSizeChange,
    totalTrades,
    computed: { tradeSize },
  } = useStore();
  const { data: srcTokenUsdValue18, isLoading: usdPriceLoading } = useUsdValue(srcToken);

  const maxTrades = useMemo(() => {
    return BigNumber.max(
      1,
      srcTokenAmount
        ?.div(
          BigNumber(10)
            .pow(srcTokenInfo?.decimals || 1)
            .div(srcTokenUsdValue18?.div(1e18) || 1)
        )
        .integerValue(BigNumber.ROUND_FLOOR) || 1
    ).toNumber();
  }, [srcTokenInfo, srcTokenUsdValue18, srcTokenAmount]);

  return {
    totalTrades,
    uiTradeSize: useGetBigNumberToUiAmount(srcToken, tradeSize),
    onTradeSizeChange,
    uiUsdValue: useGetBigNumberToUiAmount(srcToken, !tradeSize || !srcTokenUsdValue18 ? undefined : tradeSize?.times(srcTokenUsdValue18).div(1e18)),
    usdPriceLoading,
    maxValue: useGetBigNumberToUiAmount(srcToken, srcTokenAmount),
    logoUrl: srcTokenInfo?.logoUrl,
    symbol: srcTokenInfo?.symbol,
    maxTrades,
  };
};

const useChangeTokenPositions = () => {
  const switchTokens = useStore().switchTokens;
  const dstTokenAmount = useDstTokenAmount();

  return () => {
    switchTokens(dstTokenAmount);
  };
};

export const useLimitPrice = () => {
  const { isLimitOrder, limitPrice, toggleLimit, setLimitPrice, srcTokenInfo, dstTokenInfo } = useStore();
  const [inverted, setInverted] = useState(false);
  const { marketPrice, isLoading } = useMarketPrice();
  const [limitPriceUI, setlimitPriceUI] = useState<BigNumber | undefined>(limitPrice);
  const [invertedUI, setInvertedUI] = useState(false);
  const translations = useTwapTranslations();

  const leftTokenInfo = inverted ? dstTokenInfo : srcTokenInfo;
  const rightTokenInfo = !inverted ? dstTokenInfo : srcTokenInfo;

  const onChange = (amountUi?: string) => {
    setLimitPrice(amountUi ? BigNumber(amountUi) : undefined);
    setlimitPriceUI(amountUi ? BigNumber(amountUi) : undefined);
    setInvertedUI(false);
  };

  const onToggleLimit = () => {
    toggleLimit(marketPrice);
    setlimitPriceUI(marketPrice);
    setInvertedUI(false);
    setInverted(false);
  };

  const toggleInverted = () => {
    setInverted(!inverted);
    if (!invertedUI) {
      setlimitPriceUI(BigNumber(1).div(limitPrice || 1));
    } else {
      setlimitPriceUI(limitPrice);
    }
    setInvertedUI(!invertedUI);
  };

  const warning = useMemo(() => {
    if (!srcTokenInfo || !dstTokenInfo) {
      return translations.selectTokens;
    }
  }, [srcTokenInfo, dstTokenInfo, translations]);

  return {
    isLimitOrder,
    onToggleLimit,
    toggleInverted,
    onChange,
    leftTokenInfo,
    rightTokenInfo,
    limitPriceUI: limitPriceUI?.toFormat(),
    limitPrice,
    warning,
    isLoading,
  };
};

const useMarketPrice = () => {
  const [inverted, setInverted] = useState(false);
  const { srcToken, srcTokenInfo, dstToken, dstTokenInfo } = useStore();

  const { data: srcTokenUsdValue18, isLoading: srcTokenUsdLoading } = useUsdValue(srcToken);
  const { data: dstTokenUsdValue18, isLoading: dstTokenUsdLoading } = useUsdValue(dstToken);

  const leftToken = inverted ? dstToken : srcToken;
  const rightToken = !inverted ? dstToken : srcToken;

  const leftTokenInfo = inverted ? dstTokenInfo : srcTokenInfo;
  const rightTokenInfo = !inverted ? dstTokenInfo : srcTokenInfo;

  const leftUsdValue = inverted ? dstTokenUsdValue18 : srcTokenUsdValue18;
  const rightUsdValue = !inverted ? dstTokenUsdValue18 : srcTokenUsdValue18;

  const marketPrice = leftUsdValue && rightUsdValue && leftUsdValue.div(rightUsdValue);
  const isLoading = srcTokenUsdLoading || dstTokenUsdLoading;

  return {
    marketPrice: leftToken && rightToken ? marketPrice : undefined,
    toggleInverted: () => setInverted((prevState) => !prevState),
    leftToken,
    rightToken,
    inverted,
    leftTokenInfo,
    rightTokenInfo,
    srcTokenUsdLoading,
    dstTokenUsdLoading,
    isLoading,
  };
};

export const useSubmitButtonValidation = () => {
  const {
    srcTokenAmount,
    srcToken,
    srcTokenInfo,
    dstToken,
    maxDurationMillis,
    computed: { tradeIntervalMillis, tradeSize },
  } = useStore();
  const { data: srcTokenUsdValue18 } = useUsdValue(srcToken);
  const { data: srcTokenBalance } = useAccountBalances(srcToken);
  const translations = useTwapTranslations();

  const srcTokenAmountUi = useGetBigNumberToUiAmount(srcToken, srcTokenAmount);

  return useMemo(() => {
    if (!srcToken || !dstToken) {
      return translations.selectTokens;
    }
    if (!srcTokenAmount || srcTokenAmount?.isZero()) {
      return translations.enterAmount;
    }
    if (srcTokenBalance && srcTokenAmount.gt(srcTokenBalance)) {
      return translations.insufficientFunds;
    }

    if (!tradeSize || tradeSize?.isZero()) {
      return translations.enterTradeSize;
    }

    if (maxDurationMillis === 0) {
      return translations.enterMaxDuration;
    }

    if (tradeIntervalMillis === 0) {
      return translations.enterTradeInterval;
    }

    if (srcTokenAmount && tradeSize && srcTokenUsdValue18 && srcTokenInfo && isTradeSizeTooSmall(srcTokenAmount, tradeSize, srcTokenUsdValue18, srcTokenInfo)) {
      return translations.tradeSizeMustBeEqual;
    }
  }, [translations, dstToken, srcTokenAmount, srcTokenUsdValue18, tradeSize, srcTokenAmount, tradeIntervalMillis, maxDurationMillis, srcToken, srcTokenInfo, srcTokenAmountUi]);
};

const isTradeSizeTooSmall = (srcTokenAmount: BigNumber, tradeSize: BigNumber, srcTokenUsdValue18: BigNumber, srcTokenInfo: TokenInfo) => {
  const smallestTradeSize = srcTokenAmount.modulo(tradeSize).eq(0) ? tradeSize : srcTokenAmount.modulo(tradeSize);
  return smallestTradeSize?.times(srcTokenUsdValue18).div(1e18).lt(BigNumber(10).times(srcTokenInfo.decimals));
};

const usePartialFillValidation = () => {
  const {
    totalTrades,
    maxDurationMillis,
    computed: { tradeIntervalMillis },
  } = useStore();
  const translations = useTwapTranslations();

  return useMemo(() => {
    if (!totalTrades || totalTrades === 0 || !tradeIntervalMillis || !maxDurationMillis) {
      return;
    }

    const showWarning = BigNumber(tradeIntervalMillis).times(totalTrades).gt(BigNumber(maxDurationMillis));

    if (showWarning) {
      return translations.partialFillWarning;
    }
  }, [totalTrades, tradeIntervalMillis, maxDurationMillis, translations]);
};

function useSubmitOrder() {
  const warning = useSubmitButtonValidation();
  const { isApproved, approve, approveLoading } = useTokenApproval();
  const { isInvalidChain, changeNetwork, config, account } = useWeb3();
  const { wrap, shouldWrap, isLoading: wrapLoading } = useWrapToken();
  const { connect } = useContext(TwapContext);
  const { showConfirmation, setShowConfirmation, disclaimerAccepted, reset } = useStore();
  const { refetch } = useOrders();
  const translations = useTwapTranslations();

  const { srcTokenInfo, dstTokenInfo, srcTokenAmount, tradeSize, minAmountOut, deadline, tradeIntervalMillis } = useConfirmation();

  const { mutate: createOrder, isLoading: createdOrderLoading } = useMutation(
    async () => {
      const tx = async () => {
        const twap = contract(twapAbi as Abi, config.twapAddress);

        console.log({
          exchangeAddress: config.exchangeAddress,
          srcToken: srcTokenInfo?.address,
          dstToken: dstTokenInfo?.address,
          srcTokenAmount: srcTokenAmount?.toString(),
          tradeSizeToString: tradeSize?.toString(),
          tradeSize: tradeSize,
          minAmountOut: minAmountOut.toString(),
          deadline: Math.round(deadline / 1000),
          tradeInterval: Math.round(tradeIntervalMillis / 1000),
        });

        return twap.methods
          .ask(
            config.exchangeAddress,
            srcTokenInfo?.address,
            dstTokenInfo?.address,
            srcTokenAmount?.toString(),
            tradeSize?.toString(),
            minAmountOut.toString(),
            Math.round(deadline / 1000),
            Math.round(tradeIntervalMillis / 1000)
          )
          .send({ from: account });
      };
      await txHandler(tx);
      await refetch();
    },
    {
      onSuccess: () => {
        reset();
      },
    }
  );

  const values = () => {
    if (!account) {
      return { text: translations.connect, onClick: connect };
    }
    if (isInvalidChain) {
      return { text: translations.switchNetwork, onClick: changeNetwork };
    }

    if (warning) {
      return { text: warning, onClick: () => {}, disabled: true };
    }
    if (shouldWrap) {
      return { text: translations.wrap, onClick: wrap, loading: wrapLoading };
    }
    if (!isApproved) {
      return { text: translations.approve, onClick: approve, loading: approveLoading };
    }
    if (!showConfirmation) {
      return { text: translations.placeOrder, onClick: () => setShowConfirmation(true) };
    }

    return { text: translations.confirmOrder, onClick: createOrder, loading: createdOrderLoading, disabled: !disclaimerAccepted };
  };

  return { ...values(), showConfirmation };
}

export const useTokenPanel = (isSrcToken?: boolean) => {
  const { srcToken, setSrcToken, srcTokenInfo, onSrcTokenChange, srcTokenAmount, dstToken, setDstToken, dstTokenInfo, isLimitOrder } = useStore();
  const [tokenListOpen, setTokenListOpen] = useState(false);
  const destTokenAmount = useDstTokenAmount();
  const { data: srcTokenBalance, isLoading: srcTokenBalanceLoading } = useAccountBalances(srcToken);
  const { data: dstTokenBalance, isLoading: dstTokenBalanceLoading } = useAccountBalances(dstToken);
  const { data: srcTokenUsdValue, isLoading: srcTokenUsdValueLoading } = useUsdValue(srcToken);
  const { data: dstTokenUsdValue, isLoading: dstTokenUsdValueLoading } = useUsdValue(dstToken);
  const translations = useTwapTranslations();
  const { account } = useWeb3();
  const { TokenSelectModal }: { TokenSelectModal: any } = useContext(TwapContext);
  const srcTokenAmountUi = useGetBigNumberToUiAmount(srcToken, srcTokenAmount);
  const onSelectSrcToken = (token: TokenInfo) => {
    if (dstTokenInfo && eqIgnoreCase(token.address, dstTokenInfo?.address)) {
      return;
    }
    setSrcToken(token);
  };

  const onSelectDstToken = (token: TokenInfo) => {
    if (srcTokenInfo && eqIgnoreCase(token.address, srcTokenInfo?.address)) {
      return;
    }
    if (isNativeToken(token.address)) {
      return;
    }
    setDstToken(token);
  };

  const onSelect = (token: TokenInfo) => {
    if (isSrcToken) {
      onSelectSrcToken(token);
    } else {
      onSelectDstToken(token);
    }
    setTokenListOpen(false);
  };

  const dstTokenValueUi = useGetBigNumberToUiAmount(dstToken, destTokenAmount) || "0";
  const srcTokenValue = srcTokenUsdValueLoading ? " " : srcTokenAmountUi;
  const dstTokenValue = dstTokenUsdValueLoading ? " " : dstTokenValueUi;

  const srcTokenBalanceUi = useGetBigNumberToUiAmount(srcToken, srcTokenBalance);
  const dstTokenBalanceUi = useGetBigNumberToUiAmount(dstToken, dstTokenBalance);
  const srcTokenUsdValueUi = useGetBigNumberToUiAmount(srcToken, srcTokenAmount?.times(srcTokenUsdValue || 0).div(1e18));
  const dstTokenUsdValueUi = useGetBigNumberToUiAmount(dstToken, destTokenAmount?.times(dstTokenUsdValue || 0).div(1e18));
  const selectedToken = isSrcToken ? srcTokenInfo : dstTokenInfo;
  return {
    selectedToken,
    value: isSrcToken ? srcTokenValue : dstTokenValue,
    onChange: isSrcToken ? onSrcTokenChange : undefined,
    balance: isSrcToken ? srcTokenBalanceUi : dstTokenBalanceUi,
    balanceLoading: isSrcToken ? srcTokenBalanceLoading : dstTokenBalanceLoading,
    disabled: !isSrcToken || !account || !selectedToken,
    usdValue: isSrcToken ? srcTokenUsdValueUi : dstTokenUsdValueUi,
    usdValueLoading: isSrcToken ? srcTokenUsdValueLoading && !!srcTokenAmount : dstTokenUsdValueLoading && !!destTokenAmount,
    onSelect,
    tokenListOpen,
    toggleTokenList: (value: boolean) => setTokenListOpen(value),
    amountPrefix: isSrcToken ? "" : isLimitOrder ? "≥" : "~",
    TokenSelectModal,
    inputWarningTooltip: !isSrcToken ? undefined : !srcToken ? translations.selectTokens : undefined,
    tokenSeletWarningTooltip: !account ? translations.connect : undefined,
  };
};

const useConfirmation = () => {
  const {
    totalTrades,
    srcToken,
    srcTokenInfo,
    srcTokenAmount,
    dstTokenInfo,
    dstToken,
    isLimitOrder,
    showConfirmation,
    setShowConfirmation,
    disclaimerAccepted,
    setDisclaimerAccepted,
    reset,
    computed: { deadline, deadlineUi, tradeIntervalMillis, tradeSize, minAmountOut },
  } = useStore();

  const { data: srcTokenUsdValue18 } = useUsdValue(srcToken);
  const { data: dstTokenUsdValue18 } = useUsdValue(dstToken);
  const dstTokenAmount = useDstTokenAmount();

  const result = {
    deadlineUi,
    tradeIntervalUi: useGetTradeIntervalForUi(tradeIntervalMillis),
    totalTrades,
    uiTradeSize: useGetBigNumberToUiAmount(srcToken, tradeSize),
    srcTokenUsdValue: useGetBigNumberToUiAmount(srcToken, !srcTokenUsdValue18 ? undefined : srcTokenAmount?.times(srcTokenUsdValue18).div(1e18)),
    srcTokenUiAmount: useGetBigNumberToUiAmount(srcToken, srcTokenAmount),
    srcTokenInfo,
    dstTokenUsdValue: useGetBigNumberToUiAmount(dstToken, !dstTokenUsdValue18 ? undefined : dstTokenAmount?.times(dstTokenUsdValue18).div(1e18)),
    dstTokenUiAmount: useGetBigNumberToUiAmount(dstToken, dstTokenAmount),
    dstTokenInfo,
    minAmountOut,
    minAmountOutUi: useGetBigNumberToUiAmount(dstToken, minAmountOut),
    isLimitOrder,
    srcTokenAmount,
    tradeSize,
    deadline,
    tradeIntervalMillis,
    showConfirmation,
    closeConfirmation: () => setShowConfirmation(false),
    disclaimerAccepted,
    setDisclaimerAccepted,
    reset,
  };

  const isValid = _.every(_.values(result));

  return result;
};

// all hooks with state, export state only from here
export const store = {
  useActionHandlers,
  useMaxDuration,
  useTradeInterval,
  useLimitPrice,
  useTradeSize,
  useChangeTokenPositions,
  useMarketPrice,
  useTokenApproval,
  useAccountBalances,
  useWeb3,
  useWrapToken,
  useSubmitOrder,
  useTokenPanel,
  useConfirmation,
};

// all validation hooks
export const validation = {
  useSubmitButtonValidation,
  usePartialFillValidation,
};

const getDerivedTradeInterval = (maxDurationMillis: number, totalTrades: number) => {
  if (maxDurationMillis > 0 && totalTrades > 0) {
    const derivedMillis = Math.max(maxDurationMillis / totalTrades, 60_000);

    return {
      derivedMillis,
      derivedTimeFormat: TimeFormat.valueOf(derivedMillis),
    };
  } else {
    return {
      derivedMillis: 0,
      derivedTimeFormat: TimeFormat.Minutes,
    };
  }
};

export const getBigNumberToUiAmount = async (token?: Token, amount?: BigNumber) => {
  if (!amount || !token) {
    return " ";
  }

  return (await token.mantissa(amount || zero)).toFormat();
};

export const useGetBigNumberToUiAmount = (token?: Token, amount?: BigNumber) => {
  return useQuery(
    [`useGetBigNumberToUiAmount`, token?.address, amount?.toString()],
    () => {
      return getBigNumberToUiAmount(token, amount) || " ";
    },
    { enabled: !!token }
  ).data;
};

export const getUiAmountToBigNumber = async (token?: Token, amountUi?: string) => {
  if (amountUi === "" || !token) {
    return undefined;
  }
  return token?.amount(parsebn(amountUi || "0"));
};

const isNativeToken = (address?: string) => {
  if (!address) {
    return false;
  }

  return !!nativeAddresses.find((it) => eqIgnoreCase(address, it));
};

export const useGetTradeIntervalForUi = (value: number) => {
  const translations = useTwapTranslations();

  return useMemo(() => {
    if (!value) {
      return "0";
    }
    const time = moment.duration(value);
    const days = time.days();
    const hours = time.hours();
    const minutes = time.minutes();
    const seconds = time.seconds();

    let arr: string[] = [];

    if (days) {
      arr.push(`${days} ${translations.days} `);
    }
    if (hours) {
      arr.push(`${hours} ${translations.hours} `);
    }
    if (minutes) {
      arr.push(`${minutes} ${translations.minutes}`);
    }
    if (seconds) {
      arr.push(`${seconds} ${translations.seconds}`);
    }
    return arr.join(" ");
  }, [translations, value]);
};

export const makeEllipsisAddress = (address?: string, padding: number = 6): string => {
  if (!address) return "";
  const firstPart = address.substring(0, padding);
  const secondPart = address.substring(address.length - padding);
  return `${firstPart}...${secondPart}`;
};

export const getToken = (tokenInfo?: TokenInfo, isWrapped?: boolean) => {
  return erc20(tokenInfo!.symbol, tokenInfo!.address, tokenInfo!.decimals, isWrapped ? iwethabi : undefined);
};