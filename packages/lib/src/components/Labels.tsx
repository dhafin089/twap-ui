import { Styles } from "..";
import { useTwapContext } from "../context";
import { handleFillDelayText, useTwapStore } from "../store";
import { StyledRowFlex } from "../styles";
import { Icon, Label } from "./base";
import { AiOutlineHistory } from "@react-icons/all-files/ai/AiOutlineHistory";

export function ChunksAmountLabel() {
  const translations = useTwapContext().translations;

  return <Label tooltipText={translations.tradeSizeTooltip}>{translations.tradeSize} </Label>;
}

export const TotalTradesLabel = () => {
  const translations = useTwapContext().translations;

  return <Label tooltipText={translations.totalTradesTooltip}>{translations.totalTrades}</Label>;
};

export const CurrentMarketPriceLabel = () => {
  const translations = useTwapContext().translations;
  return <Label>{translations.currentMarketPrice}</Label>;
};

export const LimitPriceLabel = ({ custom }: { custom?: string }) => {
  const translations = useTwapContext().translations;
  const isLimitOrder = useTwapStore((store) => store.isLimitOrder);

  return (
    <Styles.StyledRowFlex justifyContent="flex-start" style={{ width: "auto", position: "relative" }} gap={3}>
      <Label tooltipText={isLimitOrder ? translations.limitPriceTooltip : translations.marketPriceTooltip}>{custom || translations.limitPrice}</Label>{" "}
    </Styles.StyledRowFlex>
  );
};

export const MaxDurationLabel = () => {
  const translations = useTwapContext().translations;
  return <Label tooltipText={translations.maxDurationTooltip}>{translations.maxDuration}</Label>;
};

export const TradeIntervalLabel = () => {
  const translations = useTwapContext().translations;
  const getMinimumDelayMinutes = useTwapStore((store) => store.getMinimumDelayMinutes());
  return <Label tooltipText={handleFillDelayText(translations.tradeIntervalTootlip, getMinimumDelayMinutes)}>{translations.tradeInterval}</Label>;
};

export const OrderSummaryDeadlineLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  return (
    <Label subtitle={subtitle} tooltipText={translations.confirmationDeadlineTooltip}>
      {translations.expiration}
    </Label>
  );
};

export const OrderSummaryOrderTypeLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  return (
    <Label subtitle={subtitle} tooltipText={translations.confirmationOrderType}>
      {translations.orderType}
    </Label>
  );
};

export const OrderSummaryChunkSizeLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  return (
    <Label subtitle={subtitle} tooltipText={translations.confirmationTradeSizeTooltip}>
      {translations.tradeSize}
    </Label>
  );
};

export const OrderSummaryTotalChunksLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  return (
    <Label subtitle={subtitle} tooltipText={translations.confirmationTotalTradesTooltip}>
      {translations.totalTrades}
    </Label>
  );
};

export const OrderSummaryTradeIntervalLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  return (
    <Label subtitle={subtitle} tooltipText={translations.confirmationtradeIntervalTooltip}>
      {translations.tradeInterval}
    </Label>
  );
};

export const OrderSummaryMinDstAmountOutLabel = ({ subtitle }: { subtitle?: boolean }) => {
  const translations = useTwapContext().translations;

  const isLimitOrder = useTwapStore((store) => store.isLimitOrder);
  return (
    <Label subtitle={subtitle} tooltipText={isLimitOrder ? translations.confirmationMinDstAmountTootipLimit : translations.confirmationMinDstAmountTootipMarket}>
      {translations.minReceivedPerTrade}
    </Label>
  );
};

export const OrdersLabel = ({ className = "" }: { className?: string }) => {
  const translations = useTwapContext().translations;

  return (
    <StyledRowFlex justifyContent="flex-start" style={{ width: "auto" }}>
      <Icon className="stopwatch-icon" icon={<AiOutlineHistory style={{ width: 19, height: 19 }} />} />
      <Label className={`twap-orders-title ${className}`} tooltipText={translations.ordersTooltip} fontSize={16}>
        {translations.orders}
      </Label>
    </StyledRowFlex>
  );
};
