import { Container, styled, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { FunctionComponent, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { ActionButton } from "../components/buttons/Buttons";
import { IconWithLabel } from "../components/icons/IconHelpers";
import { EmptyCircleIcon, WarningIcon } from "../components/icons/RenIcons";
import { NarrowCenteredWrapper } from "../components/layout/LayoutHelpers";
import { MobileLayout } from "../components/layout/MobileLayout";
import { Link } from "../components/links/Links";
import { UnstyledList } from "../components/typography/TypographyHelpers";
import { links, storageKeys } from "../constants/constants";
import { useNotifications } from "../providers/Notifications";
import { usePageTitle } from "../providers/TitleProviders";
import {
  getChainConfig,
  getCurrencyConfig,
  supportedBurnChains,
  supportedReleaseCurrencies,
} from "../utils/assetConfigs";
import { paths } from "./routes";

const useStyles = makeStyles((theme) => ({
  root: {},
  heading: {
    marginTop: 112,
    textAlign: "center",
    color: theme.palette.text.primary,
  },
  description: {
    marginTop: 24,
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  button: {
    maxWidth: 400,
    marginTop: 20,
  },
  supported: {
    marginTop: 82,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      justifyContent: "stretch",
    },
  },
  assets: {
    [theme.breakpoints.up("md")]: {
      paddingRight: 42,
      flexGrow: 5,
      borderRight: `2px solid ${theme.customColors.grayDisabled}`,
    },
  },
  chains: {
    // width: "20%",
    [theme.breakpoints.up("md")]: {
      paddingLeft: 40,
      flexGrow: 1,
    },
  },
  label: {
    color: theme.customColors.textLight,
    fontWeight: "bold",
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      textAlign: "left",
    },
  },
  assetsList: {
    margin: "12px auto",
    maxWidth: "40vw",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    [theme.breakpoints.up("md")]: {
      justifyContent: "space-between",
    },
  },
  assetListItem: {
    padding: `0px 4px 0px 4px`,
    [theme.breakpoints.up("sm")]: {
      padding: `0px 12px 0px 12px`,
    },
    [theme.breakpoints.up("md")]: {
      padding: 0,
    },
  },
  avalancheIcon: {
    display: "flex",
    alignItems: "center",
    fontSize: 24,
  },
}));

const AdjustedWarningIcon = styled(WarningIcon)({
  marginBottom: -5,
});

export const WelcomePage: FunctionComponent<RouteComponentProps> = ({
  history,
}) => {
  const { t } = useTranslation();
  usePageTitle(t("welcome.title"));
  const { showNotification } = useNotifications();
  const styles = useStyles();
  useEffect(() => {
    showNotification(
      <Typography variant="caption">
        <AdjustedWarningIcon fontSize="small" />{" "}
        {t("welcome.warning-message-1")}{" "}
        <Link
          href={links.SECURITY_AUDITS}
          target="_blank"
          color="primary"
          underline="hover"
        >
          {t("welcome.warning-link-text")}
        </Link>{" "}
        {t("welcome.warning-message-2")}
      </Typography>,
      {
        variant: "specialInfo",
        persist: true,
        anchorOrigin: {
          horizontal: "center",
          vertical: "top",
        },
      }
    );
  }, [showNotification, t]);
  const handleAgree = useCallback(() => {
    localStorage.setItem(storageKeys.TERMS_AGREED, "1");
    history.replace(paths.HOME);
  }, [history]);

  return (
    <MobileLayout withBackground>
      <Container maxWidth="sm">
        <Typography variant="h1" className={styles.heading}>
          {t("welcome.header")}
        </Typography>
        <Typography variant="body1" className={styles.description}>
          {t("welcome.subheader")}
        </Typography>
        <NarrowCenteredWrapper>
          <ActionButton className={styles.button} onClick={handleAgree}>
            {t("common.continue-label")}
          </ActionButton>
        </NarrowCenteredWrapper>
      </Container>
      <Container maxWidth="md">
        <div className={styles.supported}>
          <div className={styles.assets}>
            <Typography
              variant="overline"
              component="h2"
              className={styles.label}
            >
              {t("common.assets-label")}
            </Typography>
            <UnstyledList className={styles.assetsList}>
              {supportedReleaseCurrencies.map((x) => {
                const curConfig = getCurrencyConfig(x);
                return (
                  <li className={styles.assetListItem}>
                    <IconWithLabel
                      label={curConfig.full}
                      Icon={curConfig.FullIcon}
                    />
                  </li>
                );
              })}
              <li className={styles.assetListItem}>
                <IconWithLabel
                  label={t("welcome.more-soon")}
                  Icon={EmptyCircleIcon}
                />
              </li>
            </UnstyledList>
          </div>
          <div className={styles.chains}>
            <Typography
              variant="overline"
              component="h2"
              className={styles.label}
            >
              {t("common.destination-label")}
            </Typography>
            <UnstyledList className={styles.assetsList}>
              {supportedBurnChains.map((x) => {
                const chainConf = getChainConfig(x);
                return (
                  <li className={styles.assetListItem}>
                    <IconWithLabel
                      label={chainConf.full}
                      Icon={chainConf.FullIcon}
                    />
                  </li>
                );
              })}
              <li className={styles.assetListItem}>
                <IconWithLabel
                  label={t("welcome.more-soon")}
                  Icon={EmptyCircleIcon}
                />
              </li>
            </UnstyledList>
          </div>
        </div>
      </Container>
    </MobileLayout>
  );
};
