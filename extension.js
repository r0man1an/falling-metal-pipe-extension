import GLib from 'gi://GLib';
import Gst from 'gi://Gst';
import Shell from 'gi://Shell';

export default class AppLaunchSoundExtension {
    constructor() {
        this._connection = null;
        this._uri = null;
    }

    enable() {
        Gst.init(null);

        this._uri = GLib.filename_to_uri(
            GLib.build_filenamev([
                GLib.get_home_dir(),
                '.local', 'share', 'gnome-shell', 'extensions',
                'falling-metal-pipe@fcnst', 'sounds',
                'falling-metal-pipe.ogg'
            ]),
            null
        );

        const appSystem = Shell.AppSystem.get_default();
        this._connection = appSystem.connect('app-state-changed', (_sys, app) => {
            if (app.state === Shell.AppState.STARTING && Math.random() < 1/25) {
                const p = Gst.ElementFactory.make('playbin', null);
                p.set_property('uri', this._uri);
                p.get_bus().add_watch(GLib.PRIORITY_DEFAULT, (_bus, msg) => {
                    if (msg.type === Gst.MessageType.EOS || msg.type === Gst.MessageType.ERROR) {
                        p.set_state(Gst.State.NULL);
                        return false;
                    }
                    return true;
                });
                p.set_state(Gst.State.PLAYING);
            }
        });
    }

    disable() {
        if (this._connection) {
            Shell.AppSystem.get_default().disconnect(this._connection);
            this._connection = null;
        }
    }
}
