import { styled } from "@mui/system";
import React, { ReactNode } from "react";
import { useTwapContext } from "../../context";
import { useFormatNumber } from "../../hooks";
import SmallLabel from "./SmallLabel";
import Tooltip from "./Tooltip";

interface Props {
  isLoading: boolean;
  value?: string;
  className?: string;
  label?: string;
  suffix?: string;
  hideLabel?: boolean;
  emptyUi?: ReactNode;
  decimalScale?: number;
  symbol: string;
}

function Balance({ isLoading, value, className = "", label, suffix, hideLabel, emptyUi, decimalScale }: Props) {
  const { translations, uiPreferences } = useTwapContext();

  const _emptyUi = emptyUi || uiPreferences.balanceEmptyUI;

  const args = { value: value, suffix: suffix ? ` ${suffix}` : undefined };

  const formattedValue = useFormatNumber({ ...args, decimalScale });
  const formattedValueTooltip = useFormatNumber({ ...args, decimalScale: 18 });

  if (value == null) {
    return null;
  }

  return (
    <Tooltip text={formattedValueTooltip} placement="bottom">
      <StyledLabel loading={isLoading} className={`twap-balance ${className}`}>
        {hideLabel ? null : label ? <span className="twap-balance-title">{label}</span> : <span className="twap-balance-title">{translations.balance}:</span>}{" "}
        {!value && _emptyUi ? _emptyUi : <>{formattedValue}</>}
      </StyledLabel>
    </Tooltip>
  );
}

export default Balance;

const StyledLabel = styled(SmallLabel)({
  overflow: "hidden",
  minWidth: 0,
});
