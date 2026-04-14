import { render, screen } from "@testing-library/react";
import MovieCard from "@/components/MovieCard";
import type { MovieCompact } from "@/types/movie";

const movie: MovieCompact = {
  id: 7,
  tmdb_id: 700,
  title: "Arrival of Dawn",
  overview: "A sci-fi journey about first contact.",
  release_date: "2021-05-10",
  year: 2021,
  vote_average: 8.2,
  vote_count: 850,
  popularity: 72.1,
  poster_url: "/arrival.jpg",
  poster_url_small: "/arrival-small.jpg",
  genres: [],
  runtime: 125,
};

describe("MovieCard", () => {
  it("renders key movie information and runtime", () => {
    render(<MovieCard movie={movie} />);

    expect(screen.getByText("Arrival of Dawn")).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(screen.getByText("2h 5m")).toBeInTheDocument();
    expect(screen.getByText("8.2")).toBeInTheDocument();
  });

  it("shows overview text when showOverview is true", () => {
    render(<MovieCard movie={movie} showOverview />);

    expect(screen.getByText("A sci-fi journey about first contact.")).toBeInTheDocument();
  });

  it("links to the movie details page", () => {
    render(<MovieCard movie={movie} />);

    const movieLink = screen.getByRole("link", { name: /arrival of dawn/i });
    expect(movieLink).toHaveAttribute("href", "/movie/700");
  });
});
