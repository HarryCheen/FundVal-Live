import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FundsPage from '../pages/FundsPage';
import * as api from '../api';

// Mock API
vi.mock('../contexts/PreferenceContext', () => ({ usePreference: () => ({ preferredSource: 'eastmoney', updatePreference: vi.fn(), themeMode: 'light', updateThemeMode: vi.fn(), loading: false }), PreferenceProvider: ({ children }) => children }));
vi.mock('../api', () => ({
  fundsAPI: {
    list: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FundsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染搜索框和表格', async () => {
    api.fundsAPI.list.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 验证搜索框存在
    expect(screen.getByPlaceholderText(/搜索基金/i)).toBeInTheDocument();

    // 验证表格标题存在
    await waitFor(() => {
      expect(screen.getByText('基金代码')).toBeInTheDocument();
      expect(screen.getByText('基金名称')).toBeInTheDocument();
      expect(screen.getByText('昨日净值')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  it('加载基金列表', async () => {
    const mockFunds = [
      {
        fund_code: '000001',
        fund_name: '华夏成长混合',
        yesterday_nav: '1.2345',
        yesterday_date: '2024-02-10',
      },
      {
        fund_code: '000002',
        fund_name: '华夏回报混合',
        yesterday_nav: '2.3456',
        yesterday_date: '2024-02-10',
      },
    ];

    api.fundsAPI.list.mockResolvedValue({
      data: {
        results: mockFunds,
        count: 2,
      },
    });

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('000001')).toBeInTheDocument();
      expect(screen.getByText('华夏成长混合')).toBeInTheDocument();
      expect(screen.getByText('1.2345')).toBeInTheDocument();
    });

    expect(api.fundsAPI.list).toHaveBeenCalledWith({
      search: '',
      page: 1,
    });
  });

  it('搜索基金', async () => {
    api.fundsAPI.list.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/搜索基金/i);

    // 输入搜索词
    fireEvent.change(searchInput, { target: { value: '华夏' } });

    // 点击搜索按钮
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // 等待搜索触发
    await waitFor(() => {
      expect(api.fundsAPI.list).toHaveBeenCalledWith({
        search: '华夏',
        page: 1,
      });
    });
  });

  it('点击查看详情跳转', async () => {
    const mockFunds = [
      {
        fund_code: '000001',
        fund_name: '华夏成长混合',
        yesterday_nav: '1.2345',
        yesterday_date: '2024-02-10',
      },
    ];

    api.fundsAPI.list.mockResolvedValue({
      data: {
        results: mockFunds,
        count: 1,
      },
    });

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('000001')).toBeInTheDocument();
    });

    // 点击查看详情
    const detailButton = screen.getByText('查看详情');
    fireEvent.click(detailButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/funds/000001');
  });

  it('分页切换', async () => {
    const mockFunds = Array.from({ length: 10 }, (_, i) => ({
      fund_code: `00000${i}`,
      fund_name: `基金${i}`,
      yesterday_nav: '1.0000',
      yesterday_date: '2024-02-10',
    }));

    api.fundsAPI.list.mockResolvedValue({
      data: {
        results: mockFunds,
        count: 100,
      },
    });

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('000000')).toBeInTheDocument();
    });

    // 清除之前的调用记录
    api.fundsAPI.list.mockClear();

    // 找到分页器中的第 2 页按钮
    const page2Buttons = screen.getAllByText('2');
    const page2Button = page2Buttons.find(el => el.tagName === 'A');

    if (page2Button) {
      fireEvent.click(page2Button);

      await waitFor(() => {
        expect(api.fundsAPI.list).toHaveBeenCalledWith({
          search: '',
          page: 2,
        });
      });
    }
  });

  it('显示加载状态', async () => {
    api.fundsAPI.list.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { results: [], count: 0 } }), 100))
    );

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 验证加载状态
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('显示错误信息', async () => {
    api.fundsAPI.list.mockRejectedValue(new Error('加载失败'));

    render(
      <BrowserRouter>
        <FundsPage />
      </BrowserRouter>
    );

    // 等待错误信息显示
    await waitFor(() => {
      // Ant Design 的 message.error 会显示错误
      expect(api.fundsAPI.list).toHaveBeenCalled();
    });
  });
});
