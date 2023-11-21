import { styled } from "@mui/material";
import Icon from "./Icon";
import { IoIosArrowDown } from "react-icons/io";
import Tooltip from "./Tooltip";
import { useTwapContext } from "../../context";
import { useTwapStore } from "../../store";
import { StyledOneLineText, StyledRowFlex } from "../../styles";
import { FC, ReactNode } from "react";

interface Props {
  onClick: () => void;
  className?: string;
  hideArrow?: boolean;
  customUi: ReactNode;
  customButtonElement?: FC ;
}

function TokenSelectButton({ className = "", onClick, hideArrow, customUi, customButtonElement }: Props) {
  const translations = useTwapContext().translations;
  const wrongNetwork = useTwapStore((state) => state.wrongNetwork);
  const maker = useTwapStore((state) => state.lib?.maker);

  const selectTokenWarning = () => {
    if (wrongNetwork) {
      return translations.switchNetwork;
    }
    if (!maker) {
      return translations.connect;
    }
  };

  const warning = selectTokenWarning();

  const _onClick = () => {
    if (warning) return;
    onClick();
  };

  const Btn = customButtonElement || StyledContainer;

  return (
    <Tooltip text={warning}>
      <Btn className={`twap-token-select ${className}`} onClick={_onClick}>
        <StyledRowFlex>
          {customUi ? (
            <>{customUi}</>
          ) : (
            <>
              <StyledOneLineText>{translations.selectToken}</StyledOneLineText>
              {!hideArrow && <Icon icon={<IoIosArrowDown size={20} />} />}
            </>
          )}
        </StyledRowFlex>
      </Btn>
    </Tooltip>
  );
}

export default TokenSelectButton;

const StyledContainer = styled("div")({
  cursor: "pointer",
});
