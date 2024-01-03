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
import Gio from "gi://Gio";
import GnomeDesktop from "gi://GnomeDesktop";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { BindingTracker, Destroyer } from "./common/lifecycle.js";
import { CombinedUtcClockLabel } from "./label.js";
import { DestructibleExtension } from "./common/extension.js";
import type { DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js";
import { PACKAGE_NAME as GNOME_VERSION } from "resource:///org/gnome/shell/misc/config.js";

interface DateMenuButtonInternals {
  readonly _clock?: GnomeDesktop.WallClock;
  readonly _clockDisplay?: St.Label;
}

/**
 * Check that the date menu button has the expected internal attributes.
 *
 * We rely upon private things for monkey-patching, so let's assert that these
 * still exist, to fail with a clear error message instead of random undefined
 * errors, in case GNOME Shell changes this in future releases.
 *
 * @param button The date menu button to check
 * @returns Whether the button has the expected internal attributes.
 */
const hasClock = (
  button: DateMenuButton,
): button is DateMenuButton & Required<DateMenuButtonInternals> => {
  const internals = button as DateMenuButtonInternals;
  return (
    internals._clock instanceof GnomeDesktop.WallClock &&
    internals._clockDisplay instanceof St.Label
  );
};

const initialize = (extension: Extension, destroyer: Destroyer): void => {
  const settings = extension.getSettings();
  const bindings = destroyer.add(new BindingTracker());

  const dateMenu = Main.panel.statusArea.dateMenu;
  if (!hasClock(dateMenu)) {
    throw new Error(
      `The date menu button lacks expected internal attributes for monkey patching in this GNOME Shell version ${GNOME_VERSION}`,
    );
  }

  const clockLabel = destroyer.add(new CombinedUtcClockLabel());
  settings.bind(
    "clock-format",
    clockLabel,
    "clockFormat",
    Gio.SettingsBindFlags.DEFAULT,
  );

  bindings.add(
    dateMenu._clock.bind_property(
      "clock",
      clockLabel,
      "wallClock",
      GObject.BindingFlags.SYNC_CREATE,
    ),
  );

  // Insert our custom label beneath the original clock label.  We need to use
  // get_parent here because there are intermediate layout actors; the
  // original label is not an immediate child of the date menu.
  dateMenu._clockDisplay
    .get_parent()
    ?.insert_child_below(clockLabel, dateMenu._clockDisplay);

  // Hide original label
  dateMenu._clockDisplay.set_width(0);
  dateMenu.label_actor = clockLabel;
  destroyer.add({
    destroy() {
      // Restore the original label
      dateMenu._clockDisplay.set_width(-1);
      dateMenu.label_actor = dateMenu._clockDisplay;
    },
  });
};

/**
 * A GNOME shell extension which adds a customizable UTC clock to the date menu button.
 */
export default class UTCClockExtension extends DestructibleExtension {
  override initialize(destroyer: Destroyer): void {
    initialize(this, destroyer);
  }
}
