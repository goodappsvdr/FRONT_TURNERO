/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton, SkeletonCard, SkeletonList } from "./skeleton";

describe("Skeleton Components", () => {
  it("renders Skeleton with default props", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("animate-pulse");
  });

  it("renders Skeleton with custom dimensions", () => {
    render(<Skeleton width={100} height={50} />);
    expect(screen.getByRole("status")).toHaveStyle({
      width: "100px",
      height: "50px",
    });
  });

  it("renders circular Skeleton", () => {
    render(<Skeleton variant="circular" width={40} height={40} />);
    expect(screen.getByRole("status")).toHaveClass("rounded-full");
  });

  it("renders rectangular Skeleton", () => {
    render(<Skeleton variant="rectangular" width={100} height={50} />);
    expect(screen.getByRole("status")).toHaveClass("rounded-md");
  });

  it("renders SkeletonCard with multiple skeleton elements", () => {
    render(<SkeletonCard />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it("renders SkeletonList with multiple items", () => {
    render(<SkeletonList count={3} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});
