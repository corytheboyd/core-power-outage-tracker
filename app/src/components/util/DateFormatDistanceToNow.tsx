import { type FunctionComponent } from "react";
import { formatDistance } from "date-fns/formatDistance";
import { useDateNow } from "../../lib/useDateNow.ts";

type DateFormatDistanceToNowProps =
  | { from: Date; to?: never }
  | { from?: never; to: Date };

export const DateFormatDistanceToNow: FunctionComponent<
  DateFormatDistanceToNowProps
> = ({ from, to }) => {
  const now = useDateNow({ update: { interval: 1000 } });

  let first: Date;
  let second: Date;
  if (from) {
    first = from;
    second = now;
  } else {
    first = now;
    second = to;
  }

  return (
    <time dateTime={(from ?? to).toISOString()}>
      {formatDistance(first, second, {
        addSuffix: true,
        includeSeconds: true,
      })}
    </time>
  );
};
