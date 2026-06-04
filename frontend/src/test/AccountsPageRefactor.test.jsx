import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountsPage from '../pages/AccountsPage';

const { mockAccountsData } = vi.hoisted(() => ({ mockAccountsData: [] }));

vi.mock('../api', () => ({
  accountsAPI: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('../contexts/PreferenceContext', () => ({
  usePreference: () => ({ preferredSource: 'eastmoney', updatePreference: vi.fn(), themeMode: 'light', updateThemeMode: vi.fn(), loading: false }),
  PreferenceProvider: ({ children }) => children,
}));
vi.mock('../contexts/AccountContext', () => ({
  useAccounts: () => ({
    accounts: mockAccountsData,
    loading: false,
    loadAccounts: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
  }),
  AccountProvider: ({ children }) => children,
}));

const childA = { id: 'child-1', name: '子账户A', parent: 'parent-1', is_default: false, holding_cost: '5000.00', holding_value: '6000.00', pnl: '1000.00', pnl_rate: '0.2000', estimate_value: '6250.00', estimate_pnl: '1250.00', today_pnl: '250.00', today_pnl_rate: '0.0417' };
const childB = { id: 'child-2', name: '子账户B', parent: 'parent-1', is_default: false, holding_cost: '5000.00', holding_value: '6000.00', pnl: '1000.00', pnl_rate: '0.2000', estimate_value: '6250.00', estimate_pnl: '1250.00', today_pnl: '250.00', today_pnl_rate: '0.0417' };
const childC = { id: 'child-3', name: '子账户C', parent: 'parent-2', is_default: false, holding_cost: '8000.00', holding_value: '9000.00', pnl: '1000.00', pnl_rate: '0.1250', estimate_value: '9200.00', estimate_pnl: '1200.00', today_pnl: '200.00', today_pnl_rate: '0.0222' };

const parent1 = { id: 'parent-1', name: '默认父账户', parent: null, is_default: true, holding_cost: '10000.00', holding_value: '12000.00', pnl: '2000.00', pnl_rate: '0.2000', estimate_value: '12500.00', estimate_pnl: '2500.00', today_pnl: '500.00', today_pnl_rate: '0.0417', children: [childA, childB] };
const parent2 = { id: 'parent-2', name: '其他父账户', parent: null, is_default: false, holding_cost: '8000.00', holding_value: '9000.00', pnl: '1000.00', pnl_rate: '0.1250', estimate_value: '9200.00', estimate_pnl: '1200.00', today_pnl: '200.00', today_pnl_rate: '0.0222', children: [childC] };

function setAccounts(accounts) {
  mockAccountsData.length = 0;
  mockAccountsData.push(...accounts);
}

function renderPage() {
  render(<BrowserRouter><AccountsPage /></BrowserRouter>);
}

// 切换到单账户视图
async function switchToSingleView() {
  await waitFor(() => { expect(screen.getByTestId('all-accounts-summary-button')).toBeInTheDocument(); });
  fireEvent.click(screen.getByTestId('all-accounts-summary-button'));
  await waitFor(() => { expect(screen.getByTestId('parent-account-selector')).toBeInTheDocument(); });
}

describe('AccountsPage - 阶段四重构', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountsData.length = 0;
  });

  describe('父账户选择器', () => {
    it('显示父账户选择器', async () => {
      setAccounts([parent1, parent2]);
      renderPage();
      await switchToSingleView();
    });

    it('默认选中默认父账户', async () => {
      setAccounts([parent1, parent2]);
      renderPage();
      await switchToSingleView();
      const selector = screen.getByTestId('parent-account-selector');
      expect(selector).toHaveTextContent('默认父账户');
    });

    it('切换父账户选择器', async () => {
      setAccounts([parent1, parent2]);
      renderPage();
      await switchToSingleView();

      const selector = screen.getByTestId('parent-account-selector');
      fireEvent.mouseDown(selector.querySelector('.ant-select-selector'));
      await waitFor(() => { expect(screen.getByText('其他父账户')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('其他父账户'));
      await waitFor(() => { expect(selector).toHaveTextContent('其他父账户'); });
    });
  });

  describe('全部账户汇总按钮', () => {
    it('显示切换按钮', async () => {
      setAccounts([parent1]);
      renderPage();
      await waitFor(() => { expect(screen.getByTestId('all-accounts-summary-button')).toBeInTheDocument(); });
    });

    it('点击返回单账户切换到单账户视图', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();
    });
  });

  describe('父账户汇总行', () => {
    it('显示父账户汇总行', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();
      await waitFor(() => { expect(screen.getByTestId('parent-account-summary')).toBeInTheDocument(); });
    });

    it('父账户汇总显示正确', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();

      await waitFor(() => {
        const summary = screen.getByTestId('parent-account-summary');
        expect(summary).toHaveTextContent('10000.00');
        expect(summary).toHaveTextContent('12000.00');
        expect(summary).toHaveTextContent('2000.00');
        expect(summary).toHaveTextContent('20.00%');
      });
    });
  });

  describe('子账户列表', () => {
    it('显示子账户列表', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();
      await waitFor(() => { expect(screen.getByTestId('child-accounts-list')).toBeInTheDocument(); });
    });

    it('子账户列表显示正确', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();
      await waitFor(() => {
        expect(screen.getByText('子账户A')).toBeInTheDocument();
        expect(screen.getByText('子账户B')).toBeInTheDocument();
      });
    });

    it('子账户显示汇总字段', async () => {
      setAccounts([parent1]);
      renderPage();
      await switchToSingleView();
      await waitFor(() => {
        const childList = screen.getByTestId('child-accounts-list');
        expect(childList).toHaveTextContent('5000.00');
        expect(childList).toHaveTextContent('6000.00');
        expect(childList).toHaveTextContent('1000.00');
      });
    });
  });

  describe('切换父账户后更新视图', () => {
    it('切换父账户后更新汇总和子账户列表', async () => {
      setAccounts([parent1, parent2]);
      renderPage();
      await switchToSingleView();

      await waitFor(() => {
        expect(screen.getByText('子账户A')).toBeInTheDocument();
      });

      const selector = screen.getByTestId('parent-account-selector');
      fireEvent.mouseDown(selector.querySelector('.ant-select-selector'));
      await waitFor(() => { expect(screen.getByText('其他父账户')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('其他父账户'));

      await waitFor(() => {
        expect(screen.getByText('子账户C')).toBeInTheDocument();
        expect(screen.queryByText('子账户A')).not.toBeInTheDocument();
      });

      const summary = screen.getByTestId('parent-account-summary');
      expect(summary).toHaveTextContent('8000.00');
      expect(summary).toHaveTextContent('9000.00');
    });
  });

  describe('无子账户的父账户', () => {
    it('显示空子账户列表', async () => {
      const emptyParent = { id: 'parent-empty', name: '空父账户', parent: null, is_default: true, holding_cost: '0.00', holding_value: '0.00', pnl: '0.00', pnl_rate: null, estimate_value: '0.00', today_pnl: '0.00', children: [] };
      setAccounts([emptyParent]);
      renderPage();
      await switchToSingleView();
      await waitFor(() => {
        expect(screen.getByTestId('child-accounts-list')).toHaveTextContent(/暂无子账户/);
      });
    });
  });
});
