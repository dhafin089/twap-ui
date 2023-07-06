import { GlobalStyles, Box, ThemeProvider, Typography } from "@mui/material";
import { Components, TWAPTokenSelectProps, hooks, Translations, TwapAdapter, Styles as TwapStyles, store, TwapErrorWrapper, Orders, TWAPProps } from "@orbs-network/twap-ui";
import translations from "./i18n/en.json";
import {
  configureStyles,
  darkTheme,
  lightTheme,
  StyledAcceptDisclaimer,
  StyledButton,
  StyledChunksInput,
  StyledChunksSlider,
  StyledColumnFlex,
  StyledLimitPrice,
  StyledLimitPriceInput,
  StyledMarketPriceContainer,
  StyledOutputAddress,
  StyledPoweredBy,
  StyledReset,
  StyledSummaryModal,
} from "./styles";

import React, { JSXElementConstructor, memo, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  StyledBalance,
  StyledContainer,
  StyledContainerContent,
  StyledEmptyUSD,
  StyledMarketPrice,
  StyledPercentSelect,
  StyledSelectAndBalance,
  StyledTokenChange,
  StyledTokenChangeContainer,
  StyledTokenPanel,
  StyledTokenPanelInput,
  StyledTokenPanelInputContainer,
  StyledTokenSelect,
  StyledUSD,
} from "./styles";
import { MdArrowDropDown } from "react-icons/md";
import { AiOutlineArrowDown } from "react-icons/ai";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { isNativeAddress } from "@defi.org/web3-candies";
import { Configs, TokenData } from "@orbs-network/twap";
import { createContext, useContext } from "react";
import { GrPowerReset } from "react-icons/gr";
import Web3 from "web3";
import _ from "lodash";

interface AdapterProps extends TWAPProps {
  dappTokens: { [key: string]: any };
  isDarkTheme?: boolean;
  getProvider: () => Promise<any>;
  ConnectButton: JSXElementConstructor<any>;
}

const AdapterContext = createContext({} as AdapterProps);

const AdapterContextProvider = AdapterContext.Provider;

const useAdapterContext = () => useContext(AdapterContext);

const config = Configs.PancakeSwap;

const parseToken = (rawToken: any): TokenData | undefined => {
  const { address, decimals, symbol, logoURI } = rawToken;
  if (!symbol) {
    console.error("Invalid token", rawToken);
    return;
  }
  if (!address || isNativeAddress(address) || address === "BNB") {
    return config.nativeToken;
  }
  return {
    address: Web3.utils.toChecksumAddress(address),
    decimals,
    symbol,
    logoUrl: logoURI,
  };
};

const storeOverride = {
  isLimitOrder: true,
  chunks: 1,
  customDuration: { resolution: store.TimeResolution.Days, amount: 7 },
  customFillDelay: { resolution: store.TimeResolution.Minutes, amount: 2 },
};

const ModifiedTokenSelectModal = (props: TWAPTokenSelectProps) => {
  const { TokenSelectModal } = useAdapterContext();

  return (
    <TokenSelectModal
      selectedCurrency={props.srcTokenSelected}
      otherSelectedCurrency={props.dstTokenSelected}
      onCurrencySelect={props.onSelect}
      onDismiss={props.onClose}
      open={props.isOpen}
    />
  );
};
const memoizedTokenSelect = memo(ModifiedTokenSelectModal);

const findToken = (dappTokens?: any, address?: string) => {
  if (!address || !dappTokens) {
    return undefined;
  }
  if (isNativeAddress(address)) {
    return config.nativeToken;
  }
  return dappTokens[address.toLowerCase()];
};

const TokenSelect = ({ open, onClose, isSrcToken }: { open: boolean; onClose: () => void; isSrcToken?: boolean }) => {
  const { dappTokens } = useAdapterContext();

  const tokensLength = _.size(dappTokens);

  const srcTokenAddress = store.useTwapStore((s) => s.srcToken)?.address;
  const dstTokenAddress = store.useTwapStore((s) => s.dstToken)?.address;

  const selectedCurrency = useMemo(() => {
    return findToken(dappTokens, srcTokenAddress);
  }, [srcTokenAddress, tokensLength]);

  const otherSelectedCurrency = useMemo(() => {
    return findToken(dappTokens, dstTokenAddress);
  }, [dstTokenAddress, tokensLength]);

  return (
    <Components.TokenSelectModal
      Component={memoizedTokenSelect}
      isOpen={open}
      srcTokenSelected={selectedCurrency}
      dstTokenSelected={otherSelectedCurrency}
      onClose={onClose}
      isSrc={isSrcToken}
      parseToken={parseToken}
    />
  );
};

export const TokenPanel = ({ isSrcToken }: { isSrcToken?: boolean }) => {
  const [tokenListOpen, setTokenListOpen] = useState(false);
  const onClose = useCallback(() => {
    setTokenListOpen(false);
  }, []);

  return (
    <>
      <TokenSelect onClose={onClose} open={tokenListOpen} isSrcToken={isSrcToken} />

      <StyledTokenPanel>
        <TwapStyles.StyledColumnFlex gap={8}>
          <Container
            viewOnly={!isSrcToken}
            enabled={isSrcToken ? 1 : 0}
            label={
              <StyledSelectAndBalance>
                <StyledTokenSelect CustomArrow={MdArrowDropDown} hideArrow={false} isSrc={isSrcToken} onClick={() => setTokenListOpen(true)} />
                <StyledBalance decimalScale={8} isSrc={isSrcToken} />
              </StyledSelectAndBalance>
            }
          >
            {" "}
            <StyledTokenPanelInputContainer>
              <StyledTokenPanelInput placeholder="0.0" isSrc={isSrcToken} />
              <StyledUSD suffix=" USD" prefix=" " isSrc={isSrcToken} emptyUi={<StyledEmptyUSD />} />
              {isSrcToken && <SrcTokenPercentSelector />}
            </StyledTokenPanelInputContainer>
          </Container>
        </TwapStyles.StyledColumnFlex>
      </StyledTokenPanel>
    </>
  );
};

export const Container = ({
  label,
  children,
  enabled,
  hideChildren,
  className = "",
  viewOnly,
}: {
  label: ReactNode;
  children: ReactNode;
  enabled?: number;
  hideChildren?: boolean;
  className?: string;
  viewOnly?: boolean;
}) => {
  return (
    <StyledContainer className={className}>
      {label}
      {!hideChildren && (
        <StyledContainerContent viewOnly={viewOnly ? 1 : 0} enabled={enabled}>
          {children}
        </StyledContainerContent>
      )}
    </StyledContainer>
  );
};

const CurrentMarketPrice = () => {
  return (
    <StyledMarketPriceContainer justifyContent="space-between">
      <Components.Base.Label>Market price</Components.Base.Label>
      <StyledMarketPrice hideLabel={true} />
    </StyledMarketPriceContainer>
  );
};

const SrcTokenPercentSelector = () => {
  const onPercentClick = hooks.useCustomActions().onPercentClick;

  const onClick = (value: number) => {
    onPercentClick(value);
  };

  return (
    <StyledPercentSelect>
      <StyledButton onClick={() => onClick(0.25)}>25%</StyledButton>
      <StyledButton onClick={() => onClick(0.5)}>50%</StyledButton>
      <StyledButton onClick={() => onClick(0.75)}>75%</StyledButton>
      <StyledButton onClick={() => onClick(1)}>MAX</StyledButton>
    </StyledPercentSelect>
  );
};

const OrderSummary = ({ children }: { children: ReactNode }) => {
  return (
    <StyledSummaryModal>
      <TwapStyles.StyledColumnFlex gap={14}>
        <TwapStyles.StyledColumnFlex gap={14}>
          <Components.Base.Card>
            <Components.OrderSummaryTokenDisplay isSrc={true} />
          </Components.Base.Card>
          <Components.Base.Card>
            <Components.OrderSummaryTokenDisplay />
          </Components.Base.Card>
          <Components.Base.Card>
            <Components.OrderSummaryLimitPrice />
          </Components.Base.Card>
          <Components.Base.Card>{children}</Components.Base.Card>
          <Components.Base.Card>
            <TwapStyles.StyledColumnFlex gap={10}>
              <Components.DisclaimerText />
            </TwapStyles.StyledColumnFlex>
          </Components.Base.Card>
        </TwapStyles.StyledColumnFlex>
        <Components.Base.Card>
          <TwapStyles.StyledColumnFlex gap={12}>
            <StyledAcceptDisclaimer variant="ios" />
            <StyledOutputAddress />
          </TwapStyles.StyledColumnFlex>
        </Components.Base.Card>
        <Components.SubmitButton />
      </TwapStyles.StyledColumnFlex>
    </StyledSummaryModal>
  );
};

const ChangeTokensOrder = () => {
  const [hover, setHover] = useState(false);
  return (
    <StyledTokenChangeContainer onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <StyledTokenChange icon={hover ? <HiMiniArrowsUpDown /> : <AiOutlineArrowDown />} />
    </StyledTokenChangeContainer>
  );
};

const useProvider = (props: AdapterProps) => {
  const [provider, setProvider] = useState<any>();

  const chainId = props.connectedChainId;
  const account = props.account;

  const _getProvider = useCallback(async () => {
    const provider = await props.getProvider();
    setProvider(provider);
    console.log(provider);
  }, [account, chainId, setProvider, props.getProvider]);

  useEffect(() => {
    setProvider(undefined);
    _getProvider();
  }, [account, chainId, _getProvider, setProvider]);

  return provider;
};

const TWAP = (props: AdapterProps) => {
  const provider = useProvider(props);

  const theme = useMemo(() => {
    return props.isDarkTheme ? darkTheme : lightTheme;
  }, [props.isDarkTheme]);

  return (
    <TwapErrorWrapper>
      <Box className="twap-adapter-wrapper">
        <TwapAdapter
          connect={props.connect}
          config={config}
          maxFeePerGas={props.maxFeePerGas}
          priorityFeePerGas={props.priorityFeePerGas}
          translations={translations as Translations}
          provider={provider}
          account={props.account}
          srcToken={props.srcToken}
          dstToken={props.dstToken}
          storeOverride={props.limit ? storeOverride : undefined}
          parseToken={parseToken}
          dappTokens={props.dappTokens}
        >
          <ThemeProvider theme={theme}>
            <GlobalStyles styles={configureStyles(theme) as any} />
            <AdapterContextProvider value={{ ...props, provider }}>
              {props.limit ? <LimitPanel /> : <TWAPPanel />}
              <Components.Base.Portal id={props.ordersContainerId}>
                <Orders getLabel={(label, amount) => `${label} (${amount})`} />
              </Components.Base.Portal>
            </AdapterContextProvider>
          </ThemeProvider>
        </TwapAdapter>
      </Box>
    </TwapErrorWrapper>
  );
};

const OpenConfirmationModalButton = () => {
  const { ConnectButton, provider } = useAdapterContext();

  if (!provider) {
    return <ConnectButton />;
  }

  return <Components.SubmitButton isMain={true} />;
};

export { TWAP };

const LimitPanel = () => {
  return (
    <div className="twap-container">
      <StyledColumnFlex>
        <TokenPanel isSrcToken={true} />
        <ChangeTokensOrder />
        <TokenPanel />
        <CurrentMarketPrice />
        <LimitPrice limitOnly={true} />
        <OpenConfirmationModalButton />
      </StyledColumnFlex>
      <OrderSummary>
        <TwapStyles.StyledColumnFlex>
          <Components.OrderSummaryDetailsDeadline />
          <Components.OrderSummaryDetailsOrderType />
          <Components.OrderSummaryDetailsChunkSize />
          <Components.OrderSummaryDetailsMinDstAmount />
        </TwapStyles.StyledColumnFlex>
      </OrderSummary>
      <StyledPoweredBy />
    </div>
  );
};

const TWAPPanel = () => {
  return (
    <div className="twap-container">
      <StyledColumnFlex>
        <TokenPanel isSrcToken={true} />
        <ChangeTokensOrder />
        <TokenPanel />
        <CurrentMarketPrice />
        <LimitPrice />
        <TotalTrades />
        <TradeSize />
        <TradeInterval />
        <MaxDuration />
        <OpenConfirmationModalButton />
      </StyledColumnFlex>
      <OrderSummary>
        <Components.OrderSummaryDetails />
      </OrderSummary>
      <StyledPoweredBy />
    </div>
  );
};

const TotalTrades = () => {
  const getChunksBiggerThanOne = store.useTwapStore((store) => store.getChunksBiggerThanOne());

  return (
    <Container enabled={getChunksBiggerThanOne ? 1 : 0} label={<Components.Labels.TotalTradesLabel />}>
      <TwapStyles.StyledRowFlex gap={15} justifyContent="space-between">
        <StyledChunksSlider showDefault={true} />
        <StyledChunksInput showDefault={true} />
      </TwapStyles.StyledRowFlex>
    </Container>
  );
};

const TradeSize = () => {
  return (
    <Container label={<Components.Labels.ChunksAmountLabel />} viewOnly={true}>
      <TwapStyles.StyledRowFlex className="twap-trade-size" justifyContent="flex-start" gap={5}>
        <Components.TradeSize hideLabel={true} />
        <Components.ChunksUSD prefix="(" suffix=" USD)" emptyUi={<></>} />
      </TwapStyles.StyledRowFlex>
    </Container>
  );
};

const MaxDuration = () => {
  return (
    <Container enabled={1} label={<Components.Labels.MaxDurationLabel />}>
      <TwapStyles.StyledRowFlex justifyContent="space-between">
        <Components.PartialFillWarning />
        <Components.MaxDurationSelector />
      </TwapStyles.StyledRowFlex>
    </Container>
  );
};

const TradeInterval = () => {
  return (
    <Container enabled={1} label={<Components.Labels.TradeIntervalLabel />}>
      <TwapStyles.StyledRowFlex style={{ flex: 1 }}>
        <Components.FillDelayWarning />
        <Components.TradeIntervalSelector />
      </TwapStyles.StyledRowFlex>
    </Container>
  );
};

const LimitPrice = ({ limitOnly }: { limitOnly?: boolean }) => {
  const isLimitOrder = store.useTwapStore((store) => store.isLimitOrder);

  return (
    <StyledLimitPrice>
      <Container
        enabled={1}
        hideChildren={!isLimitOrder}
        label={
          <TwapStyles.StyledRowFlex justifyContent="space-between">
            <TwapStyles.StyledRowFlex style={{ width: "auto" }}>
              <Components.Labels.LimitPriceLabel />
              <Components.ResetLimitButton>
                <StyledReset>
                  <TwapStyles.StyledRowFlex gap={8}>
                    <GrPowerReset />
                    <Typography>Market</Typography>
                  </TwapStyles.StyledRowFlex>
                </StyledReset>
              </Components.ResetLimitButton>
            </TwapStyles.StyledRowFlex>
            {!limitOnly && <Components.LimitPriceToggle variant="ios" />}
          </TwapStyles.StyledRowFlex>
        }
      >
        <StyledLimitPriceInput placeholder="0" sx={{ pointerEvents: limitOnly ? "all" : isLimitOrder ? "all" : "none" }} />
      </Container>
    </StyledLimitPrice>
  );
};