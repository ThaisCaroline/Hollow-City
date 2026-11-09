package br.com.hollowcity;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        esconderBarras();
    }

    // Minimizar o app: o WebView não avisa a página, então chamamos pausarJogoNoApp (js/game.js), que faz o Phaser
    // suspender o áudio e parar o relógio. O WebView só é pausado depois que o script rodou.
    @Override
    public void onPause() {
        super.onPause();
        final WebView web = webView();
        if (web == null) return;
        web.evaluateJavascript("window.pausarJogoNoApp && window.pausarJogoNoApp()", valor -> web.onPause());
    }

    @Override
    public void onResume() {
        super.onResume();
        WebView web = webView();
        if (web == null) return;
        web.onResume();
        web.evaluateJavascript("window.retomarJogoNoApp && window.retomarJogoNoApp()", null);
    }

    private WebView webView() {
        return getBridge() != null ? getBridge().getWebView() : null;
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) esconderBarras();
    }

    // Tela cheia imersiva: esconde barra de status e de navegação (voltam com um deslize na borda)
    private void esconderBarras() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controle =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controle.hide(WindowInsetsCompat.Type.systemBars());
        controle.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
