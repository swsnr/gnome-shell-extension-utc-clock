// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0.If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Alternatively, the contents of this file may be used under the terms
// of the GNU General Public License Version 2 or later, as described below:
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";
import St from "gi://St";

/**
 * A label which combines the GNOME desktop wall clock with our custom UTC clock.
 */
export const CombinedUtcClockLabel = GObject.registerClass(
  {
    Properties: {
      wallClock: GObject.ParamSpec.string(
        "wallClock",
        "WallClock",
        "Wall clock text",
        GObject.ParamFlags.READWRITE,
        null,
      ),
      clockFormat: GObject.ParamSpec.string(
        "clockFormat",
        "ClockFormat",
        "Clock format",
        GObject.ParamFlags.READWRITE,
        "%H:%M",
      ),
    },
  },
  class UtcClockLabel extends St.Label {
    #wallClock: string | null = null;
    #clockFormat = "%H:%M";

    constructor(props?: St.Label.ConstructorProperties) {
      super(props);
      this.add_style_class_name("clock");
      this.clutter_text.y_align = Clutter.ActorAlign.CENTER;
      this.updateClock();
    }

    /**
     * The wall clock text to show.
     */
    get wallClock(): string | null {
      return this.#wallClock;
    }

    set wallClock(value: string | null) {
      this.#wallClock = value;
      this.updateClock();
    }

    /**
     * The clock format for the UTC part.
     */
    get clockFormat(): string {
      return this.#clockFormat;
    }

    set clockFormat(value: string) {
      this.#clockFormat = value;
      this.updateClock();
    }

    /**
     * Update our clock.
     */
    private updateClock(): void {
      const now = GLib.DateTime.new_now_utc();
      const utcNow = now.format(this.#clockFormat);
      const wallClock = this.#wallClock ?? "";
      this.set_text(`${wallClock}\u2003${utcNow}`);
    }
  },
);

export type CombinedUtcClockLabel = InstanceType<typeof CombinedUtcClockLabel>;
