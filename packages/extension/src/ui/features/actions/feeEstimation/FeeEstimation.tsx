import { TextWithAmount } from "@argent/ui"
import { FC, useMemo } from "react"

import { isUndefined } from "lodash-es"
import {
  prettifyCurrencyValue,
  prettifyTokenAmount,
} from "../../../../shared/token/price"
import {
  FeeEstimationBox,
  FeeEstimationBoxWithDeploy,
} from "./ui/FeeEstimationBox"
import { FeeEstimationText } from "./ui/FeeEstimationText"
import { InsufficientFundsAccordion } from "./ui/InsufficientFundsAccordion"
import { TransactionFailureAccordion } from "./ui/TransactionFailureAccordion"
import { WaitingForFunds } from "./ui/WaitingForFunds"
import { getTooltipText } from "./utils"
import { FeeEstimationProps } from "./feeEstimation.model"
import {
  estimatedFeesToMaxFeeTotal,
  estimatedFeesToTotal,
} from "../../../../shared/transactionSimulation/utils"

export const FeeEstimation: FC<FeeEstimationProps> = ({
  amountCurrencyValue,
  fee,
  feeToken,
  parsedFeeEstimationError,
  showError,
  showFeeError,
  suggestedMaxFeeCurrencyValue,
  userClickedAddFunds,
  needsDeploy,
}) => {
  const amount = fee && estimatedFeesToTotal(fee)
  const maxFee = fee && estimatedFeesToMaxFeeTotal(fee)

  const tooltipText = useMemo(() => {
    if (maxFee) {
      return getTooltipText(maxFee, feeToken.balance)
    }
  }, [feeToken.balance, maxFee])
  const primaryText = useMemo(() => {
    if (amount) {
      return (
        <TextWithAmount amount={amount} decimals={feeToken.decimals}>
          <>
            {feeToken ? (
              prettifyTokenAmount({
                amount,
                decimals: feeToken.decimals,
                symbol: feeToken.symbol,
              })
            ) : (
              <>{amount} Unknown</>
            )}
            {amountCurrencyValue !== undefined &&
              ` (${prettifyCurrencyValue(amountCurrencyValue)})`}
          </>
        </TextWithAmount>
      )
    }
  }, [amount, amountCurrencyValue, feeToken])
  const secondaryText = useMemo(() => {
    if (maxFee) {
      return (
        <TextWithAmount amount={maxFee} decimals={feeToken.decimals}>
          <>
            Max&nbsp;
            {feeToken ? (
              prettifyTokenAmount({
                amount: maxFee,
                decimals: feeToken.decimals,
                symbol: feeToken.symbol,
              })
            ) : (
              <>{maxFee} Unknown</>
            )}
            {suggestedMaxFeeCurrencyValue !== undefined &&
              ` (Max ${prettifyCurrencyValue(suggestedMaxFeeCurrencyValue)})`}
          </>
        </TextWithAmount>
      )
    }
  }, [feeToken, maxFee, suggestedMaxFeeCurrencyValue])
  const isLoading = !fee || isUndefined(feeToken.balance) // because 0n is a valid balance but falsy

  if (!showError) {
    return needsDeploy ? (
      <FeeEstimationBoxWithDeploy>
        <FeeEstimationText
          tooltipText={tooltipText}
          primaryText={primaryText}
          secondaryText={secondaryText}
          isLoading={isLoading}
        />
      </FeeEstimationBoxWithDeploy>
    ) : (
      <FeeEstimationBox>
        <FeeEstimationText
          tooltipText={tooltipText}
          primaryText={primaryText}
          secondaryText={secondaryText}
          isLoading={isLoading}
        />
      </FeeEstimationBox>
    )
  }
  if (userClickedAddFunds) {
    return <WaitingForFunds />
  }
  if (showFeeError) {
    return (
      <InsufficientFundsAccordion
        tooltipText={tooltipText}
        primaryText={primaryText}
        secondaryText={secondaryText}
      />
    )
  }
  return (
    <TransactionFailureAccordion
      parsedFeeEstimationError={parsedFeeEstimationError}
    />
  )
}
