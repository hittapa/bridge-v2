import { combineReducers } from "@reduxjs/toolkit";
import { releaseReducer } from "../features/release/releaseSlice";
import { renDataReducer } from "../features/renData/renDataSlice";
import { marketDataReducer } from "../features/marketData/marketDataSlice";
import { mintReducer } from "../features/mint/mintSlice";
import { transactionsReducer } from "../features/transactions/transactionsSlice";
import { walletReducer } from "../features/wallet/walletSlice";

const rootReducer = combineReducers({
  mint: mintReducer,
  release: releaseReducer,
  renData: renDataReducer,
  marketData: marketDataReducer,
  wallet: walletReducer,
  transactions: transactionsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
