import "@testing-library/jest-dom";
import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { fill, priority, unoptimized, ...imgProps } = props as React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      unoptimized?: boolean;
    };
    return React.createElement("img", { ...imgProps, alt: props.alt ?? "" });
  },
}));
