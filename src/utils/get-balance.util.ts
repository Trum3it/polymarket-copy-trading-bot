import { Contract, providers, utils } from 'ethers';
import type { Wallet } from 'ethers';

const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

export async function getUsdBalanceApprox(
  wallet: Wallet,
  usdcContractAddress: string,
): Promise<number> {
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Wallet provider is required');
  }
  // Ensure address is checksummed to avoid ENS resolution
  const address = utils.getAddress(wallet.address);
  const contractAddress = utils.getAddress(usdcContractAddress);
  const usdcContract = new Contract(contractAddress, USDC_ABI, provider);
  const balance = await usdcContract.balanceOf(address);
  return parseFloat(utils.formatUnits(balance, 6));
}


export async function getPolBalance(wallet: Wallet): Promise<number> {
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Wallet provider is required');
  }
  // Ensure address is checksummed to avoid ENS resolution
  const address = utils.getAddress(wallet.address);
  const balance = await provider.getBalance(address);
  return parseFloat(utils.formatEther(balance));
}

