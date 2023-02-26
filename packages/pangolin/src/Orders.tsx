import { hooks, Orders, OrdersAdapter, Translations } from "@orbs-network/twap-ui";
import { memo } from "react";
import { getConfig, parseToken } from "./hooks";
import translations from "./i18n/en.json";
import { PangolinOrdersProps } from "./types";

function OrderHistory(props: PangolinOrdersProps) {
  const tokenList = hooks.useParseTokens(props.dappTokens, parseToken);
  const { partnerDaas, config } = getConfig(props.partnerDaas);

  return (
    <OrdersAdapter
      connectedChainId={props.connectedChainId}
      account={props.account}
      config={config}
      provider={props.provider}
      translations={translations as Translations}
      tokenList={tokenList}
      maxFeePerGas={props.maxFeePerGas}
      priorityFeePerGas={props.priorityFeePerGas}
      askDataParams={[partnerDaas]}
    >
      <Orders />
    </OrdersAdapter>
  );
}

export default memo(OrderHistory);