import { Link as MuiLink, LinkProps } from "@material-ui/core";
import React, { FunctionComponent } from "react";
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import {blueLight} from '../../theme/colors';

export const externalLinkAttributes = {
  target: "_blank",
  rel: "noopener noreferrer",
};

export type CustomLinkProps = LinkProps & {
  external?: boolean;
  to?: any;
};

export const Link: FunctionComponent<CustomLinkProps> = ({
  external,
  children,
  target = external ? "_blank" : undefined,
  to,
  ...rest
}) => {
  const additionalParams =
    target === "_blank"
      ? {
          rel: externalLinkAttributes.rel,
        }
      : {};
  if (to) {
    return (
      <MuiLink
        component={RouterLink}
        to={to}
        target={target}
        {...rest}
        {...additionalParams}
      >
        {children}
        {external && " ↗"}
      </MuiLink>
    );
  }
  return (
    <MuiLink target={target} {...rest} {...additionalParams} color='textPrimary' >
      {children}
      {external && " ↗"}
    </MuiLink>
  );
};

export { RouterLink, MuiLink };
export type { RouterLinkProps };
