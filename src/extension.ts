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
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import type { DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js";

/**
 * A label which combines the GNOME desktop wall clock with our custom UTC clock.
 */
const CombinedUtcClockLabel = GObject.registerClass(
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

type CombinedUtcClockLabel = InstanceType<typeof CombinedUtcClockLabel>;

/**
 * The state of the enabled extension.
 */
class EnabledExtension {
  /**
   * The clock display label.
   */
  private readonly clockLabel: CombinedUtcClockLabel;

  /**
   * Property bindings to unbind upon destruction.
   */
  private readonly bindings: GObject.Binding[] = [];

  /**
   * The settings of this extension.
   */
  private readonly settings: Gio.Settings;

  /**
   * Create a new enabled extension.
   *
   * Creates a label to display the wall clock along with our UTC clock, and
   * connect to wall clock updates as well as settings changes to update the
   * clock as it ticks, or whenever the user changes the time format to use.
   *
   * @param settings The settings of this extension
   */
  constructor(settings: Gio.Settings) {
    this.settings = settings;
    this.clockLabel = new CombinedUtcClockLabel();
    this.settings.bind(
      "clock-format",
      this.clockLabel,
      "clockFormat",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this.bindings.push(
      Main.panel.statusArea.dateMenu._clock.bind_property(
        "clock",
        this.clockLabel,
        "wallClock",
        GObject.BindingFlags.SYNC_CREATE,
      ),
    );

    // Insert our custom label beneath the original clock label.  We need to use
    // get_parent here because there are intermediate layout actors; the
    // original label is not an immediate child of the date menu.
    this.dateMenu._clockDisplay
      .get_parent()
      ?.insert_child_below(this.clockLabel, this.dateMenu._clockDisplay);
    // Hide the original label and make our label the label actor.
    this.dateMenu._clockDisplay.set_width(0);
    Main.panel.statusArea.dateMenu.label_actor = this.clockLabel;
  }

  /** Convenience getter for the date menu */
  private get dateMenu(): DateMenuButton {
    return Main.panel.statusArea.dateMenu;
  }

  /**
   * Destroy this extension.
   *
   * Disconnects from all signals, and destroys our label actor.
   */
  destroy() {
    while (0 < this.bindings.length) {
      this.bindings.pop()?.unbind();
    }
    this.clockLabel.destroy();
    // Restore the original label
    this.dateMenu._clockDisplay.set_width(-1);
    this.dateMenu.label_actor = this.dateMenu._clockDisplay;
  }
}

/**
 * A GNOME shell extension which adds a customizable UTC clock to the date menu button.
 */
export default class UTCClockExtension extends Extension {
  /**
   * The state of the enabled extension, or `null` if the extension is disabled.
   */
  private enabledExtension?: EnabledExtension | null;

  /**
   * Enable this extension.
   *
   * Create a new label for our custom clock, and hide the original date menu
   * label.
   */
  override enable(): void {
    if (!this.enabledExtension) {
      this.enabledExtension = new EnabledExtension(this.getSettings());
    }
  }

  /**
   * Disable this extension.
   *
   * Restore the original date menu label, and destroy the entire extension state.
   */
  override disable(): void {
    if (this.enabledExtension) {
      // Destroy our extension, and null the reference to make sure everything
      // gets cleaned up properly.
      this.enabledExtension.destroy();
      this.enabledExtension = null;
    }
  }
}
