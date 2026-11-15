import { DateDetails } from '@/components/DateDetails';
import { renderCUI } from '@/utils/test-utils';
import { fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('DateDetails', () => {
  const actualTZ = process.env.TZ;

  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );

    process.env.TZ = 'America/New_York';
  });

  afterAll(() => {
    process.env.TZ = actualTZ;
  });

  it('renders the DateDetails component with relevant timezone information', () => {
    const baseDate = new Date('2024-12-24T11:45:00');
    const systemTimeZone = 'America/Los_Angeles';
    vi.setSystemTime(baseDate);

    const fiveMinutesAgo = new Date('2024-12-24T11:40:00');

    const { getByText } = renderCUI(
      <DateDetails
        date={fiveMinutesAgo}
        systemTimeZone={systemTimeZone}
      />
    );

    const trigger = getByText('5 minutes ago');
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(getByText(/Dec 24, 11:40 a\.m\..*(EST|GMT-5)/)).toBeInTheDocument();
    expect(getByText(/Dec 24, 8:40 a\.m\..*(PST|GMT-8)/)).toBeInTheDocument();
    expect(getByText('Dec 24, 4:40 p.m.')).toBeInTheDocument();
    expect(getByText(String(fiveMinutesAgo.getTime() / 1000))).toBeInTheDocument();
  });

  it('renders the relative time as a popover button', () => {
    vi.setSystemTime(new Date('2024-12-24T11:45:00'));

    const { getByRole } = renderCUI(
      <DateDetails date={new Date('2024-12-24T11:40:00')} />
    );
    const trigger = getByRole('button', { name: '5 minutes ago' });

    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens from the keyboard and returns focus to the trigger on Escape', async () => {
    vi.setSystemTime(new Date('2024-12-24T11:45:00'));
    const user = userEvent.setup();

    const { getByRole, getByText, queryByText } = renderCUI(
      <DateDetails date={new Date('2024-12-24T11:40:00')} />
    );
    const trigger = getByRole('button', { name: '5 minutes ago' });

    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(getByText('Dec 24, 4:40 p.m.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(queryByText('Dec 24, 4:40 p.m.')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('allows for not passing in a system timezone', () => {
    const baseDate = new Date('2024-12-24T11:45:00');
    vi.setSystemTime(baseDate);

    const fiveMinutesAgo = new Date('2024-12-24T11:40:00');

    const { getByText, queryByText } = renderCUI(<DateDetails date={fiveMinutesAgo} />);

    const trigger = getByText('5 minutes ago');
    fireEvent.click(trigger);

    expect(getByText(/Dec 24, 11:40 a\.m\..*(EST|GMT-5)/)).toBeInTheDocument();
    expect(getByText('Dec 24, 4:40 p.m.')).toBeInTheDocument();
    expect(queryByText('System')).not.toBeInTheDocument();
    expect(getByText(String(fiveMinutesAgo.getTime() / 1000))).toBeInTheDocument();
  });

  it('falls back to America/New_York if the system timezone is invalid', () => {
    const baseDate = new Date('2024-12-24T11:45:00');
    vi.setSystemTime(baseDate);

    const fiveMinutesAgo = new Date('2024-12-24T11:40:00');

    const { getByText } = renderCUI(
      <DateDetails
        date={fiveMinutesAgo}
        systemTimeZone="Invalid/Timezone"
      />
    );

    fireEvent.click(getByText('5 minutes ago'));

    const systemTime = getByText('System').nextElementSibling as HTMLElement;
    expect(
      within(systemTime).getByText(/Dec 24, 11:40 a\.m\..*(EST|GMT-5)/)
    ).toBeInTheDocument();
  });

  it("only shows the date if the previous date isn't in this year", () => {
    const baseDate = new Date('2025-02-07T11:45:00');
    const systemTimeZone = 'America/Los_Angeles';
    vi.setSystemTime(baseDate);

    const oneYearAgo = new Date('2024-02-07T11:45:00');

    const { getByText } = renderCUI(
      <DateDetails
        date={oneYearAgo}
        systemTimeZone={systemTimeZone}
      />
    );

    const trigger = getByText('1 year ago');
    fireEvent.click(trigger);

    expect(getByText('Feb 7, 2024, 4:45 p.m.')).toBeInTheDocument();
    expect(getByText(/Feb 7, 2024, 11:45 a\.m\..*(EST|GMT-5)/)).toBeInTheDocument();
    expect(getByText(/Feb 7, 2024, 8:45 a\.m\..*(PST|GMT-8)/)).toBeInTheDocument();
    expect(getByText(String(oneYearAgo.getTime() / 1000))).toBeInTheDocument();
  });

  it('handles Daylight Savings Time', () => {
    const baseDate = new Date('2024-07-04T11:45:00');
    const systemTimeZone = 'America/Los_Angeles';
    vi.setSystemTime(baseDate);

    const fiveMinutesAgo = new Date('2024-07-04T11:40:00');

    const { getByText } = renderCUI(
      <DateDetails
        date={fiveMinutesAgo}
        systemTimeZone={systemTimeZone}
      />
    );

    const trigger = getByText('5 minutes ago');
    fireEvent.click(trigger);

    expect(getByText(/Jul 4, 11:40 a\.m\..*(EDT|GMT-4)/)).toBeInTheDocument();
    expect(getByText(/Jul 4, 8:40 a\.m\..*(PDT|GMT-7)/)).toBeInTheDocument();
    expect(getByText('Jul 4, 3:40 p.m.')).toBeInTheDocument();
    expect(getByText(String(fiveMinutesAgo.getTime() / 1000))).toBeInTheDocument();
  });
});
