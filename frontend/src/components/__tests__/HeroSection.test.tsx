import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeroSection from "@/components/HeroSection";
import type { MovieCompact } from "@/types/movie";

function makeMovie(overrides: Partial<MovieCompact> = {}): MovieCompact {
  return {
    id: 1,
    tmdb_id: 1001,
    title: "The First Movie",
    overview: "A compelling story.",
    release_date: "2024-01-01",
    year: 2024,
    vote_average: 7.8,
    vote_count: 100,
    popularity: 50,
    poster_url: "/poster.jpg",
    poster_url_small: "/poster-small.jpg",
    genres: [
      {
        id: 1,
        tmdb_id: 28,
        name: "Action",
        slug: "action",
      },
    ],
    runtime: 120,
    ...overrides,
  };
}

describe("HeroSection", () => {
  it("renders fallback content when no movies are provided", () => {
    render(<HeroSection movies={[]} />);

    expect(screen.getByText("Cine")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.getByText("Your cinematic discovery engine")).toBeInTheDocument();
  });

  it("renders movie title and metadata for the active slide", () => {
    const movies = [makeMovie()];
    render(<HeroSection movies={movies} />);

    expect(screen.getByText("The First Movie")).toBeInTheDocument();
    expect(screen.getByText("7.8")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("auto-advances to the next movie after the slide duration", () => {
    jest.useFakeTimers();

    const movies = [
      makeMovie({ id: 1, tmdb_id: 1001, title: "The First Movie" }),
      makeMovie({ id: 2, tmdb_id: 1002, title: "The Second Movie" }),
    ];

    render(<HeroSection movies={movies} />);

    expect(screen.getByText("The First Movie")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("The Second Movie")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("moves to the next slide when the next control is clicked", async () => {
    const user = userEvent.setup();

    const movies = [
      makeMovie({ id: 1, tmdb_id: 1001, title: "The First Movie" }),
      makeMovie({ id: 2, tmdb_id: 1002, title: "The Second Movie" }),
    ];

    render(<HeroSection movies={movies} />);

    expect(screen.getByText("The First Movie")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next slide/i }));

    expect(screen.getByText("The Second Movie")).toBeInTheDocument();
  });
});
