import { Chip, styled, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { FunctionComponent, useCallback, useState } from "react";
import { TxEntryStatus } from "../../features/transactions/transactionsUtils";
import { BridgeChain } from "../../utils/assetConfigs";
import { SmallActionButton } from "../buttons/Buttons";
import { Link } from "../links/Links";
import { SimplePagination } from "../pagination/SimplePagination";
import { TransactionStatusIndicator } from "../progress/ProgressHelpers";
import { TransactionStatusType } from "../utils/types";

type TransactionType = "mint" | "release";

export type Transaction = {
  date: string;
  time: string;
  type: TransactionType;
  status: TransactionStatusType;
};

const standardPaddings = {
  paddingLeft: 40,
  paddingRight: 40,
};

const standardShadow = `0px 0px 4px rgba(0, 27, 58, 0.1)`;

const useTransactionsHeaderStyles = makeStyles((theme) => ({
  root: {
    ...standardPaddings,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: theme.customColors.greyHeaderBackground,
    boxShadow: standardShadow,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  header: {},
  actions: {
    display: "flex",
    alignItems: "center",
    marginLeft: theme.spacing(2),
  },
}));

export const TransactionsContent = styled("div")(({ theme }) => ({
  ...standardPaddings,
}));

type TransactionsHeaderProps = {
  title?: string;
};

export const TransactionsHeader: FunctionComponent<TransactionsHeaderProps> = ({
  title,
  children,
}) => {
  const styles = useTransactionsHeaderStyles();
  return (
    <div className={styles.root}>
      <Typography variant="h6">{title}</Typography>
      <div className={styles.actions}>{children}</div>
    </div>
  );
};

const useTransactionsStatusHeaderStyles = makeStyles((theme) => ({
  root: {
    ...standardPaddings,
    paddingTop: 12,
    paddingBottom: 6,
    background: theme.customColors.greyHeaderBackground,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  title: {
    fontWeight: theme.typography.fontWeightBold,
    lineHeight: 1.2,
  },
}));

export const TransactionsStatusHeader: FunctionComponent<TransactionsHeaderProps> = ({
  title,
}) => {
  const styles = useTransactionsStatusHeaderStyles();
  return (
    <div className={styles.root}>
      {title && (
        <Typography variant="overline" className={styles.title}>
          {title}
        </Typography>
      )}
    </div>
  );
};

export const TransactionsPaginationWrapper = styled("div")(({ theme }) => ({
  ...standardPaddings,
  paddingTop: 10,
  paddingBottom: 10,
  backgroundColor: theme.customColors.greyHeaderBackground
}));

export const useTransactionEntryStyles = makeStyles((theme) => ({
  root: {
    ...standardPaddings,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  details: {
    alignSelf: "flex-start",
  },
  datetime: {},
  date: {
    marginRight: 6,
  },
  time: {
    marginRight: 32,
  },
  multiple: {
    display: "inline-flex",
    marginRight: 6,
  },
  multipleLabel: {
    marginRight: 16,
  },
  multiplePagination: {},
  description: {
    marginTop: 3,
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
  },
  links: {},
  expired: {
    fontSize: 14,
    display: "inline-block",
    marginRight: 8,
  },
  link: {
    fontSize: 14,
    display: "inline-block",
    marginRight: 24,
    "&:last-child": {
      marginRight: 0,
    },
  },
  tooltipIcon: {
    fontSize: 15,
    marginBottom: -2,
    marginRight: 2,
  },
  actions: {
    flexGrow: 1,
    paddingRight: 20,
    display: "flex",
    justifyContent: "flex-end",
  },
  status: {},
}));

type TransactionEntryProps = {
  chain: BridgeChain;
  status: TxEntryStatus;
  confirmations?: number;
};

export const TransactionEntry: FunctionComponent<TransactionEntryProps> = ({
  confirmations,
}) => {
  const styles = useTransactionEntryStyles();
  return (
    <div className={styles.root}>
      <div className={styles.details}>
        <div className={styles.datetime}>
          <Chip size="small" label="04/02/20" className={styles.date} />
          <Chip size="small" label="23:45:32 UTC" />
        </div>
        <div className={styles.description}>
          <Typography variant="body2" className={styles.title}>
            Mint 0.9877 renBTC on Ethereum
          </Typography>
        </div>
        <div className={styles.links}>
          <Link href="" external color="primary" className={styles.link}>
            Bitcoin transaction
          </Link>
          <Link href="" external color="primary" className={styles.link}>
            Ethereum transaction
          </Link>
        </div>
      </div>
      <div className={styles.actions}>
        <SmallActionButton>Submit</SmallActionButton>
      </div>
      <div className={styles.status}>
        <TransactionStatusIndicator confirmations={confirmations} />
      </div>
    </div>
  );
};

export const TransactionsGrid: FunctionComponent<any> = () => {
  const pending = 3;
  const completed = 2;

  const [page, setPage] = useState(0);
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const itemsCount = 15;
  const itemsPerPage = 4;
  return (
    <div>
      <TransactionsHeader title="Transactions" />
      <TransactionsStatusHeader title={`Pending (${pending})`} />
      <div>
        <TransactionEntry
          chain={BridgeChain.BTCC}
          status={TxEntryStatus.COMPLETED}
          confirmations={2}
        />
        <TransactionEntry
          chain={BridgeChain.BSCC}
          status={TxEntryStatus.PENDING}
        />
      </div>
      <TransactionsStatusHeader title={`Completed (${completed})`} />
      <div>
        <TransactionEntry
          chain={BridgeChain.BTCC}
          status={TxEntryStatus.COMPLETED}
        />
        <TransactionEntry
          chain={BridgeChain.BSCC}
          status={TxEntryStatus.COMPLETED}
        />
      </div>
      <TransactionsPaginationWrapper>
        <SimplePagination
          count={itemsCount}
          rowsPerPage={itemsPerPage}
          page={page}
          onChangePage={handleChangePage}
        />
      </TransactionsPaginationWrapper>
    </div>
  );
};
