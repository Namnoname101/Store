using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using Microsoft.Win32;

[assembly: AssemblyTitle("DaiTruong-helper")]
[assembly: AssemblyDescription("DaiTruong Unified AI Helper - Claude Desktop & OpenAI Codex 1-Click Configurator")]
[assembly: AssemblyCompany("DaiTruong Store")]
[assembly: AssemblyProduct("DaiTruong-helper")]
[assembly: AssemblyCopyright("Copyright © 2026 DaiTruong Store")]
[assembly: AssemblyVersion("3.0.0.0")]
[assembly: AssemblyFileVersion("3.0.0.0")]

namespace DaiTruongHelper
{
    public enum HelperMode
    {
        ClaudeDesktop,
        OpenAiCodex
    }

    public class TokenVerifyResult
    {
        public bool Success;
        public bool IsProfileToken;
        public string TokenName;
        public string QuotaInfo;
        public string ErrorMessage;
    }

    public static class App
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [STAThread]
        public static void Main()
        {
            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                try { SetCurrentProcessExplicitAppUserModelID("DaiTruong.UnifiedHelper.3"); } catch { }

                Application app = new Application();
                MainWindow mainWin = new MainWindow();
                app.Run(mainWin.Window);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Khởi động ứng dụng thất bại: " + ex.Message, "DaiTruong-helper", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public class MainWindow
    {
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        public Window Window { get; private set; }

        private HelperMode currentMode = HelperMode.ClaudeDesktop;

        // UI Controls
        private Grid TitleBar;
        private Image TitleBarIcon;
        private Button BtnMinimize;
        private Button BtnClose;

        private Border TabClaudeBorder;
        private Button TabClaudeBtn;
        private System.Windows.Shapes.Path TabClaudeIcon;
        private TextBlock TabClaudeText;

        private Border TabCodexBorder;
        private Button TabCodexBtn;
        private System.Windows.Shapes.Path TabCodexIcon;
        private TextBlock TabCodexText;

        private Grid PageConnect;
        private Grid PageProgress;
        private Grid PageDone;
        private Grid PageError;

        private Border EnvStatusCard;
        private Border EnvStatusDot;
        private TextBlock EnvStatusText;
        private Button EnvActionButton;
        private Button EnvSecondaryButton;

        private TextBlock KeyLabelText;
        private PasswordBox KeyPassword;
        private TextBox KeyVisible;
        private TextBlock KeyPlaceholder;
        private TextBlock KeyInfoText;
        private Button ToggleKey;
        private Button PasteButton;
        private Button StartButton;

        private TextBlock ProgressStatusText;
        private ProgressBar ProgressBarCtrl;
        private StackPanel ActivityList;

        private TextBlock DoneModeText;
        private TextBlock VerifiedKeyNameText;
        private TextBlock DoneModelText;
        private Button LaunchAppButton;
        private Button BackDoneButton;
        private Button CloseDoneButton;

        private TextBlock ErrorTitleText;
        private TextBlock ErrorDetailText;
        private Button RetryButton;

        private TextBlock HeaderEnvStatus;
        private Border HeaderEnvDotBorder;

        private string cachedCodexPath = null;
        private string cachedCodexAppState = "none";
        private string cachedCodexAppPackage = null;
        private string cachedCodexAppExe = null;
        private string cachedClaudeState = "none";
        private bool isKeyVisible = false;
        private DispatcherTimer checkKeyTimer;
        private string lastCheckedKey = "";
        private string claudeKeyInputCache = "";
        private string codexKeyInputCache = "";

        private const string CLAUDE_GATEWAY_URL = "https://1gw.gwai.cloud";
        private const string CLAUDE_AUTH_SCHEME = "x-api-key";
        private const string CLAUDE_POLICY_SUBKEY = @"SOFTWARE\Policies\Claude";

        private static readonly string[] CLAUDE_MANAGED_KEYS = new string[]
        {
            "inferenceProvider",
            "inferenceCredentialKind",
            "inferenceGatewayBaseUrl",
            "inferenceGatewayApiKey",
            "inferenceGatewayAuthScheme",
            "chatTabEnabled",
            "developerModeEnabled",
            "claudeAiImport"
        };

        private const string EXACT_CONFIG_TOML =
@"model_provider = ""OpenAI""
model = ""gpt-6.1-sol""
review_model = ""gpt-6.1-sol""
model_reasoning_effort = ""xhigh""
disable_response_storage = true
network_access = ""enabled""
windows_wsl_setup_acknowledged = true
model_context_window = 1000000
model_auto_compact_token_limit = 900000

[model_providers.OpenAI]
name = ""OpenAI""
base_url = ""https://modelapi.vn/v1""
wire_api = ""responses""
requires_openai_auth = true
";

        public MainWindow()
        {
            InitializeComponentFromXaml();
            BindControls();
            LoadWindowIcon();
            EnableNativeDarkWindow();
            AttachEvents();
            SwitchMode(HelperMode.ClaudeDesktop);
        }

        private void InitializeComponentFromXaml()
        {
            string xaml = @"
<Window xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation""
        xmlns:x=""http://schemas.microsoft.com/winfx/2006/xaml""
        Title=""DaiTruong-helper""
        Width=""456"" Height=""304"" MinWidth=""456"" MinHeight=""304""
        WindowStartupLocation=""CenterScreen"" ResizeMode=""CanMinimize""
        WindowStyle=""None"" AllowsTransparency=""False""
        Background=""#18181B"" FontFamily=""Segoe UI, Segoe UI Variable Text"" Foreground=""#F4F4F5"">
    <Window.Resources>
        <Style TargetType=""Button"">
            <Setter Property=""Cursor"" Value=""Hand""/>
            <Setter Property=""FontFamily"" Value=""Segoe UI""/>
        </Style>
    </Window.Resources>

    <Border Background=""#18181B"" BorderBrush=""#2E2E34"" BorderThickness=""1"">
        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height=""36""/>
                <RowDefinition Height=""1""/>
                <RowDefinition Height=""*""/>
            </Grid.RowDefinitions>

            <!-- TITLEBAR -->
            <Grid Grid.Row=""0"" x:Name=""TitleBar"" Background=""#18181B"">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width=""Auto""/>
                    <ColumnDefinition Width=""*""/>
                    <ColumnDefinition Width=""Auto""/>
                    <ColumnDefinition Width=""Auto""/>
                </Grid.ColumnDefinitions>

                <StackPanel Orientation=""Horizontal"" VerticalAlignment=""Center"" Margin=""14,0,0,0"">
                    <Image x:Name=""TitleBarIcon"" Width=""16"" Height=""16"" Margin=""0,0,8,0"" VerticalAlignment=""Center"" RenderOptions.BitmapScalingMode=""HighQuality""/>
                    <TextBlock Text=""DaiTruong-helper"" FontSize=""12"" FontWeight=""SemiBold"" Foreground=""#E4E4E7"" VerticalAlignment=""Center""/>
                    <Border Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" CornerRadius=""3"" Padding=""5,1"" Margin=""8,0,0,0"" VerticalAlignment=""Center"">
                        <TextBlock Text=""v3.0"" FontSize=""9.5"" FontWeight=""SemiBold"" Foreground=""#A1A1AA""/>
                    </Border>
                </StackPanel>

                <Border Grid.Column=""1"" Background=""Transparent""/>

                <StackPanel Grid.Column=""2"" Orientation=""Horizontal"" VerticalAlignment=""Center"" Margin=""0,0,10,0"">
                    <Border x:Name=""HeaderEnvDotBorder"" Width=""6"" Height=""6"" CornerRadius=""3"" Background=""#10B981"" VerticalAlignment=""Center"" Margin=""0,0,6,0""/>
                    <TextBlock x:Name=""HeaderEnvStatus"" Text=""Sẵn sàng"" FontSize=""11"" Foreground=""#A1A1AA"" VerticalAlignment=""Center""/>
                </StackPanel>

                <StackPanel Grid.Column=""3"" Orientation=""Horizontal"" VerticalAlignment=""Center"">
                    <Button x:Name=""BtnMinimize"" Width=""40"" Height=""36"" Background=""Transparent"" Foreground=""#A1A1AA"" BorderThickness=""0"">
                        <Button.Template>
                            <ControlTemplate TargetType=""Button"">
                                <Border x:Name=""b"" Background=""{TemplateBinding Background}"">
                                    <Path Data=""M0,0 L10,0"" Stroke=""{TemplateBinding Foreground}"" StrokeThickness=""1.2"" HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                </Border>
                                <ControlTemplate.Triggers>
                                    <Trigger Property=""IsMouseOver"" Value=""True"">
                                        <Setter TargetName=""b"" Property=""Background"" Value=""#27272A""/>
                                        <Setter Property=""Foreground"" Value=""#F4F4F5""/>
                                    </Trigger>
                                </ControlTemplate.Triggers>
                            </ControlTemplate>
                        </Button.Template>
                    </Button>
                    <Button x:Name=""BtnClose"" Width=""40"" Height=""36"" Background=""Transparent"" Foreground=""#A1A1AA"" BorderThickness=""0"">
                        <Button.Template>
                            <ControlTemplate TargetType=""Button"">
                                <Border x:Name=""b"" Background=""{TemplateBinding Background}"">
                                    <Path Data=""M0,0 L9,9 M9,0 L0,9"" Stroke=""{TemplateBinding Foreground}"" StrokeThickness=""1.2"" HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                </Border>
                                <ControlTemplate.Triggers>
                                    <Trigger Property=""IsMouseOver"" Value=""True"">
                                        <Setter TargetName=""b"" Property=""Background"" Value=""#C42B1C""/>
                                        <Setter Property=""Foreground"" Value=""White""/>
                                    </Trigger>
                                </ControlTemplate.Triggers>
                            </ControlTemplate>
                        </Button.Template>
                    </Button>
                </StackPanel>
            </Grid>

            <Border Grid.Row=""1"" Background=""#27272A""/>

            <!-- MAIN WORKSPACE -->
            <Grid Grid.Row=""2"" Margin=""18,14,18,14"">

                <!-- SCREEN 1: CONNECT -->
                <Grid x:Name=""PageConnect"" Visibility=""Visible"">
                    <StackPanel VerticalAlignment=""Top"">

                        <!-- 2-TAB SEGMENTED CONTROL -->
                        <Border Background=""#121215"" BorderBrush=""#27272A"" BorderThickness=""1"" CornerRadius=""6"" Padding=""3"" Margin=""0,0,0,12"">
                            <Grid Height=""32"">
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width=""*""/>
                                    <ColumnDefinition Width=""*""/>
                                </Grid.ColumnDefinitions>

                                <!-- Tab 1: Claude Desktop -->
                                <Border x:Name=""TabClaudeBorder"" Grid.Column=""0"" Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" CornerRadius=""4"">
                                    <Button x:Name=""TabClaudeBtn"" Background=""Transparent"" BorderThickness=""0"">
                                        <Button.Template>
                                            <ControlTemplate TargetType=""Button"">
                                                <Border Background=""Transparent"">
                                                    <StackPanel Orientation=""Horizontal"" HorizontalAlignment=""Center"" VerticalAlignment=""Center"">
                                                        <Path x:Name=""TabClaudeIcon"" Width=""13"" Height=""13"" Stretch=""Uniform"" Fill=""#D97757"" Margin=""0,0,7,0"" VerticalAlignment=""Center""
                                                              Data=""M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z""/>
                                                        <TextBlock x:Name=""TabClaudeText"" Text=""Claude Desktop"" FontSize=""11.5"" FontWeight=""SemiBold"" Foreground=""#F4F4F5"" VerticalAlignment=""Center""/>
                                                    </StackPanel>
                                                </Border>
                                            </ControlTemplate>
                                        </Button.Template>
                                    </Button>
                                </Border>

                                <!-- Tab 2: OpenAI Codex -->
                                <Border x:Name=""TabCodexBorder"" Grid.Column=""1"" Background=""Transparent"" BorderBrush=""Transparent"" BorderThickness=""1"" CornerRadius=""4"">
                                    <Button x:Name=""TabCodexBtn"" Background=""Transparent"" BorderThickness=""0"">
                                        <Button.Template>
                                            <ControlTemplate TargetType=""Button"">
                                                <Border Background=""Transparent"">
                                                    <StackPanel Orientation=""Horizontal"" HorizontalAlignment=""Center"" VerticalAlignment=""Center"">
                                                        <Path x:Name=""TabCodexIcon"" Width=""13"" Height=""13"" Stretch=""Uniform"" Fill=""#71717A"" Margin=""0,0,7,0"" VerticalAlignment=""Center""
                                                              Data=""M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z""/>
                                                        <TextBlock x:Name=""TabCodexText"" Text=""OpenAI Codex"" FontSize=""11.5"" FontWeight=""SemiBold"" Foreground=""#A1A1AA"" VerticalAlignment=""Center""/>
                                                    </StackPanel>
                                                </Border>
                                            </ControlTemplate>
                                        </Button.Template>
                                    </Button>
                                </Border>
                            </Grid>
                        </Border>

                        <!-- ENVIRONMENT STATUS BAR -->
                        <Border x:Name=""EnvStatusCard"" Background=""#202024"" BorderBrush=""#2E2E34"" BorderThickness=""1"" CornerRadius=""5"" Padding=""10,6"" Margin=""0,0,0,12"">
                            <Grid>
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width=""Auto""/>
                                    <ColumnDefinition Width=""*""/>
                                    <ColumnDefinition Width=""Auto""/>
                                </Grid.ColumnDefinitions>
                                <Border x:Name=""EnvStatusDot"" Width=""6"" Height=""6"" CornerRadius=""3"" Background=""#10B981"" VerticalAlignment=""Center"" Margin=""0,0,8,0""/>
                                <TextBlock x:Name=""EnvStatusText"" Grid.Column=""1"" Text=""Đang kiểm tra môi trường..."" FontSize=""11"" Foreground=""#D4D4D8"" VerticalAlignment=""Center"" TextTrimming=""CharacterEllipsis""/>
                                <StackPanel Grid.Column=""2"" Orientation=""Horizontal"" VerticalAlignment=""Center"">
                                    <Button x:Name=""EnvActionButton"" Content=""Cài đặt"" Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" Foreground=""#F4F4F5"" FontSize=""10.5"" Padding=""8,2"" Visibility=""Collapsed"">
                                        <Button.Template>
                                            <ControlTemplate TargetType=""Button"">
                                                <Border x:Name=""b"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""3"">
                                                    <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                                </Border>
                                                <ControlTemplate.Triggers>
                                                    <Trigger Property=""IsMouseOver"" Value=""True"">
                                                        <Setter TargetName=""b"" Property=""Background"" Value=""#3F3F46""/>
                                                    </Trigger>
                                                </ControlTemplate.Triggers>
                                            </ControlTemplate>
                                        </Button.Template>
                                    </Button>
                                    <Button x:Name=""EnvSecondaryButton"" Content=""Cài CLI"" Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" Foreground=""#F4F4F5"" FontSize=""10.5"" Padding=""8,2"" Margin=""5,0,0,0"" Visibility=""Collapsed"">
                                        <Button.Template>
                                            <ControlTemplate TargetType=""Button"">
                                                <Border x:Name=""b"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""3"">
                                                    <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                                </Border>
                                                <ControlTemplate.Triggers>
                                                    <Trigger Property=""IsMouseOver"" Value=""True"">
                                                        <Setter TargetName=""b"" Property=""Background"" Value=""#3F3F46""/>
                                                    </Trigger>
                                                </ControlTemplate.Triggers>
                                            </ControlTemplate>
                                        </Button.Template>
                                    </Button>
                                </StackPanel>
                            </Grid>
                        </Border>

                        <!-- API KEY LABEL -->
                        <Grid Margin=""1,0,1,5"">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width=""*""/>
                                <ColumnDefinition Width=""Auto""/>
                            </Grid.ColumnDefinitions>
                            <TextBlock x:Name=""KeyLabelText"" Text=""Mã API Key (Claude Gateway)"" FontSize=""11"" FontWeight=""SemiBold"" Foreground=""#A1A1AA""/>
                            <TextBlock Grid.Column=""1"" Text=""Bảo mật cục bộ • Không lưu log"" FontSize=""10"" Foreground=""#71717A"" VerticalAlignment=""Center""/>
                        </Grid>

                        <!-- API KEY INPUT -->
                        <Border Background=""#202024"" BorderBrush=""#3F3F46"" BorderThickness=""1"" CornerRadius=""5"" Height=""36"" Padding=""10,0"">
                            <Grid VerticalAlignment=""Center"">
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width=""*""/>
                                    <ColumnDefinition Width=""Auto""/>
                                    <ColumnDefinition Width=""Auto""/>
                                </Grid.ColumnDefinitions>

                                <TextBlock x:Name=""KeyPlaceholder"" Text=""Nhập hoặc dán mã API Key tại đây..."" Foreground=""#71717A"" FontSize=""12"" VerticalAlignment=""Center"" IsHitTestVisible=""False""/>
                                <PasswordBox x:Name=""KeyPassword"" Background=""Transparent"" BorderThickness=""0"" Foreground=""#F4F4F5"" FontFamily=""Consolas"" FontSize=""12.5"" VerticalAlignment=""Center""/>
                                <TextBox x:Name=""KeyVisible"" Background=""Transparent"" BorderThickness=""0"" Foreground=""#F4F4F5"" FontFamily=""Consolas"" FontSize=""12.5"" VerticalAlignment=""Center"" Visibility=""Collapsed""/>

                                <Button x:Name=""ToggleKey"" Grid.Column=""1"" Content=""Hiện"" Background=""Transparent"" BorderThickness=""0"" Foreground=""#A1A1AA"" FontSize=""11"" Padding=""6,3"" Margin=""2,0""/>
                                <Button x:Name=""PasteButton"" Grid.Column=""2"" Content=""Dán"" Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" Foreground=""#E4E4E7"" FontSize=""11"" Padding=""9,3"" Margin=""2,0"">
                                    <Button.Template>
                                        <ControlTemplate TargetType=""Button"">
                                            <Border x:Name=""b"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""3"">
                                                <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                            </Border>
                                            <ControlTemplate.Triggers>
                                                <Trigger Property=""IsMouseOver"" Value=""True"">
                                                    <Setter TargetName=""b"" Property=""Background"" Value=""#3F3F46""/>
                                                </Trigger>
                                            </ControlTemplate.Triggers>
                                        </ControlTemplate>
                                    </Button.Template>
                                </Button>
                            </Grid>
                        </Border>

                        <!-- LIVE QUOTA VERIFICATION BADGE -->
                        <TextBlock x:Name=""KeyInfoText"" Text="""" FontSize=""11"" Foreground=""#34D399"" Margin=""2,5,0,0"" Visibility=""Collapsed"" TextTrimming=""CharacterEllipsis""/>

                        <!-- PRIMARY ACTION BUTTON -->
                        <Button x:Name=""StartButton"" Content=""Kích hoạt Claude Desktop"" Height=""36"" Background=""#0F6CBD"" Foreground=""White"" FontSize=""12.5"" FontWeight=""SemiBold"" BorderThickness=""0"" Margin=""0,12,0,0"">
                            <Button.Template>
                                <ControlTemplate TargetType=""Button"">
                                    <Border x:Name=""btnBg"" Background=""{TemplateBinding Background}"" CornerRadius=""5"">
                                        <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                    </Border>
                                    <ControlTemplate.Triggers>
                                        <Trigger Property=""IsMouseOver"" Value=""True"">
                                            <Setter TargetName=""btnBg"" Property=""Background"" Value=""#1177D1""/>
                                        </Trigger>
                                        <Trigger Property=""IsEnabled"" Value=""False"">
                                            <Setter TargetName=""btnBg"" Property=""Background"" Value=""#27272A""/>
                                            <Setter Property=""Foreground"" Value=""#71717A""/>
                                        </Trigger>
                                    </ControlTemplate.Triggers>
                                </ControlTemplate>
                            </Button.Template>
                        </Button>
                    </StackPanel>
                </Grid>

                <!-- SCREEN 2: PROGRESS -->
                <Grid x:Name=""PageProgress"" Visibility=""Collapsed"">
                    <StackPanel VerticalAlignment=""Center"">
                        <TextBlock Text=""Đang thiết lập cấu hình"" FontSize=""13"" FontWeight=""SemiBold"" Foreground=""#F4F4F5"" HorizontalAlignment=""Center""/>
                        <TextBlock x:Name=""ProgressStatusText"" Text=""Đang kiểm tra và ghi cấu hình..."" FontSize=""11"" Foreground=""#A1A1AA"" HorizontalAlignment=""Center"" Margin=""0,3,0,12""/>

                        <ProgressBar x:Name=""ProgressBarCtrl"" Height=""4"" Background=""#27272A"" Foreground=""#0F6CBD"" BorderThickness=""0"" Value=""15"" Maximum=""100"" Margin=""0,0,0,12""/>

                        <Border Background=""#202024"" BorderBrush=""#2E2E34"" BorderThickness=""1"" CornerRadius=""5"" Padding=""10,8"">
                            <StackPanel x:Name=""ActivityList""/>
                        </Border>
                    </StackPanel>
                </Grid>

                <!-- SCREEN 3: DONE -->
                <Grid x:Name=""PageDone"" Visibility=""Collapsed"">
                    <StackPanel VerticalAlignment=""Center"">
                        <TextBlock Text=""Cấu hình hoàn tất"" FontSize=""14"" FontWeight=""SemiBold"" Foreground=""#34D399"" HorizontalAlignment=""Center"" Margin=""0,0,0,10""/>

                        <Border Background=""#202024"" BorderBrush=""#2E2E34"" BorderThickness=""1"" CornerRadius=""5"" Padding=""12,8"" Margin=""0,0,0,12"">
                            <Grid>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height=""Auto""/>
                                    <RowDefinition Height=""Auto""/>
                                    <RowDefinition Height=""Auto""/>
                                </Grid.RowDefinitions>
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width=""75""/>
                                    <ColumnDefinition Width=""*""/>
                                </Grid.ColumnDefinitions>

                                <TextBlock Grid.Row=""0"" Grid.Column=""0"" Text=""Chế độ:"" FontSize=""11"" Foreground=""#A1A1AA"" Margin=""0,2""/>
                                <TextBlock x:Name=""DoneModeText"" Grid.Row=""0"" Grid.Column=""1"" Text=""Claude Desktop Gateway"" FontSize=""11"" FontWeight=""SemiBold"" Foreground=""#F4F4F5"" Margin=""0,2""/>

                                <TextBlock Grid.Row=""1"" Grid.Column=""0"" Text=""Trạng thái:"" FontSize=""11"" Foreground=""#A1A1AA"" Margin=""0,2""/>
                                <TextBlock x:Name=""VerifiedKeyNameText"" Grid.Row=""1"" Grid.Column=""1"" Text=""Key hợp lệ"" FontSize=""11"" FontWeight=""SemiBold"" Foreground=""#38BDF8"" Margin=""0,2"" TextTrimming=""CharacterEllipsis""/>

                                <TextBlock Grid.Row=""2"" Grid.Column=""0"" Text=""Mô hình AI:"" FontSize=""11"" Foreground=""#A1A1AA"" Margin=""0,2""/>
                                <TextBlock x:Name=""DoneModelText"" Grid.Row=""2"" Grid.Column=""1"" Text=""Claude Opus 5.5 &amp; Sonnet 5.5"" FontSize=""11"" Foreground=""#E4E4E7"" Margin=""0,2""/>
                            </Grid>
                        </Border>

                        <StackPanel Orientation=""Horizontal"" HorizontalAlignment=""Center"">
                            <Button x:Name=""LaunchAppButton"" Content=""Mở Claude Desktop"" Height=""32"" Padding=""14,0"" Background=""#0F6CBD"" Foreground=""White"" FontSize=""11.5"" FontWeight=""SemiBold"" BorderThickness=""0"" Margin=""0,0,8,0"">
                                <Button.Template>
                                    <ControlTemplate TargetType=""Button"">
                                        <Border x:Name=""b"" Background=""{TemplateBinding Background}"" CornerRadius=""4"">
                                            <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property=""IsMouseOver"" Value=""True"">
                                                <Setter TargetName=""b"" Property=""Background"" Value=""#1177D1""/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>
                            <Button x:Name=""BackDoneButton"" Content=""Đổi Tab / Key"" Height=""32"" Padding=""12,0"" Background=""#27272A"" BorderBrush=""#3F3F46"" BorderThickness=""1"" Foreground=""#E4E4E7"" FontSize=""11"" Margin=""0,0,8,0"">
                                <Button.Template>
                                    <ControlTemplate TargetType=""Button"">
                                        <Border x:Name=""b"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""4"">
                                            <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property=""IsMouseOver"" Value=""True"">
                                                <Setter TargetName=""b"" Property=""Background"" Value=""#3F3F46""/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>
                            <Button x:Name=""CloseDoneButton"" Content=""Đóng"" Width=""60"" Height=""32"" Background=""#18181B"" BorderBrush=""#2E2E34"" BorderThickness=""1"" Foreground=""#A1A1AA"" FontSize=""11"">
                                <Button.Template>
                                    <ControlTemplate TargetType=""Button"">
                                        <Border x:Name=""b"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""4"">
                                            <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property=""IsMouseOver"" Value=""True"">
                                                <Setter TargetName=""b"" Property=""Background"" Value=""#27272A""/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>
                        </StackPanel>
                    </StackPanel>
                </Grid>

                <!-- SCREEN 4: ERROR -->
                <Grid x:Name=""PageError"" Visibility=""Collapsed"">
                    <StackPanel VerticalAlignment=""Center"">
                        <TextBlock x:Name=""ErrorTitleText"" Text=""Không thể hoàn tất cấu hình"" FontSize=""13"" FontWeight=""SemiBold"" Foreground=""#F87171"" HorizontalAlignment=""Center"" Margin=""0,0,0,4""/>
                        <TextBlock x:Name=""ErrorDetailText"" Text=""Vui lòng kiểm tra lại mã API Key hoặc kết nối mạng."" FontSize=""11"" Foreground=""#D4D4D8"" HorizontalAlignment=""Center"" TextWrapping=""Wrap"" TextAlignment=""Center"" Margin=""0,2,0,12""/>

                        <Button x:Name=""RetryButton"" Content=""Thử lại"" Width=""90"" Height=""32"" Background=""#0F6CBD"" Foreground=""White"" FontSize=""11.5"" FontWeight=""SemiBold"" BorderThickness=""0"" HorizontalAlignment=""Center"">
                            <Button.Template>
                                <ControlTemplate TargetType=""Button"">
                                    <Border x:Name=""b"" Background=""{TemplateBinding Background}"" CornerRadius=""4"">
                                        <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
                                    </Border>
                                </ControlTemplate>
                            </Button.Template>
                        </Button>
                    </StackPanel>
                </Grid>

            </Grid>
        </Grid>
    </Border>
</Window>";

            Window = (Window)XamlReader.Parse(xaml);
        }

        private void BindControls()
        {
            TitleBar = (Grid)Window.FindName("TitleBar");
            TitleBarIcon = (Image)Window.FindName("TitleBarIcon");
            BtnMinimize = (Button)Window.FindName("BtnMinimize");
            BtnClose = (Button)Window.FindName("BtnClose");

            TabClaudeBorder = (Border)Window.FindName("TabClaudeBorder");
            TabClaudeBtn = (Button)Window.FindName("TabClaudeBtn");
            TabCodexBorder = (Border)Window.FindName("TabCodexBorder");
            TabCodexBtn = (Button)Window.FindName("TabCodexBtn");

            PageConnect = (Grid)Window.FindName("PageConnect");
            PageProgress = (Grid)Window.FindName("PageProgress");
            PageDone = (Grid)Window.FindName("PageDone");
            PageError = (Grid)Window.FindName("PageError");

            EnvStatusCard = (Border)Window.FindName("EnvStatusCard");
            EnvStatusDot = (Border)Window.FindName("EnvStatusDot");
            EnvStatusText = (TextBlock)Window.FindName("EnvStatusText");
            EnvActionButton = (Button)Window.FindName("EnvActionButton");
            EnvSecondaryButton = (Button)Window.FindName("EnvSecondaryButton");

            KeyLabelText = (TextBlock)Window.FindName("KeyLabelText");
            KeyPassword = (PasswordBox)Window.FindName("KeyPassword");
            KeyVisible = (TextBox)Window.FindName("KeyVisible");
            KeyPlaceholder = (TextBlock)Window.FindName("KeyPlaceholder");
            KeyInfoText = (TextBlock)Window.FindName("KeyInfoText");
            ToggleKey = (Button)Window.FindName("ToggleKey");
            PasteButton = (Button)Window.FindName("PasteButton");
            StartButton = (Button)Window.FindName("StartButton");

            ProgressStatusText = (TextBlock)Window.FindName("ProgressStatusText");
            ProgressBarCtrl = (ProgressBar)Window.FindName("ProgressBarCtrl");
            ActivityList = (StackPanel)Window.FindName("ActivityList");

            DoneModeText = (TextBlock)Window.FindName("DoneModeText");
            VerifiedKeyNameText = (TextBlock)Window.FindName("VerifiedKeyNameText");
            DoneModelText = (TextBlock)Window.FindName("DoneModelText");
            LaunchAppButton = (Button)Window.FindName("LaunchAppButton");
            BackDoneButton = (Button)Window.FindName("BackDoneButton");
            CloseDoneButton = (Button)Window.FindName("CloseDoneButton");

            ErrorTitleText = (TextBlock)Window.FindName("ErrorTitleText");
            ErrorDetailText = (TextBlock)Window.FindName("ErrorDetailText");
            RetryButton = (Button)Window.FindName("RetryButton");

            HeaderEnvStatus = (TextBlock)Window.FindName("HeaderEnvStatus");
            HeaderEnvDotBorder = (Border)Window.FindName("HeaderEnvDotBorder");
        }

        private void LoadWindowIcon()
        {
            try
            {
                string exePath = Process.GetCurrentProcess().MainModule.FileName;
                System.Drawing.Icon ico = System.Drawing.Icon.ExtractAssociatedIcon(exePath);
                if (ico != null)
                {
                    IntPtr hBitmap = ico.ToBitmap().GetHbitmap();
                    ImageSource wpfIcon = Imaging.CreateBitmapSourceFromHBitmap(
                        hBitmap, IntPtr.Zero, Int32Rect.Empty, BitmapSizeOptions.FromEmptyOptions());
                    Window.Icon = wpfIcon;
                    TitleBarIcon.Source = wpfIcon;
                }
            }
            catch { }
        }

        private void EnableNativeDarkWindow()
        {
            Window.SourceInitialized += (s, e) =>
            {
                try
                {
                    IntPtr hwnd = new WindowInteropHelper(Window).Handle;
                    int dark = 1;
                    DwmSetWindowAttribute(hwnd, 20, ref dark, sizeof(int));
                    DwmSetWindowAttribute(hwnd, 19, ref dark, sizeof(int));
                }
                catch { }
            };
        }

        private void AttachEvents()
        {
            TitleBar.MouseLeftButtonDown += (s, e) =>
            {
                if (e.ButtonState == MouseButtonState.Pressed)
                    Window.DragMove();
            };

            BtnMinimize.Click += (s, e) => Window.WindowState = WindowState.Minimized;
            BtnClose.Click += (s, e) => Window.Close();

            TabClaudeBtn.Click += (s, e) => SwitchMode(HelperMode.ClaudeDesktop);
            TabCodexBtn.Click += (s, e) => SwitchMode(HelperMode.OpenAiCodex);

            ToggleKey.Click += (s, e) => TogglePasswordVisibility();
            PasteButton.Click += (s, e) => PasteFromClipboard();

            checkKeyTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(450) };
            checkKeyTimer.Tick += async (s, e) =>
            {
                checkKeyTimer.Stop();
                await TriggerLiveKeyCheckAsync();
            };

            KeyPassword.PasswordChanged += (s, e) =>
            {
                if (!isKeyVisible)
                {
                    UpdatePlaceholder();
                    TriggerDebouncedCheck();
                }
            };

            KeyVisible.TextChanged += (s, e) =>
            {
                if (isKeyVisible)
                {
                    UpdatePlaceholder();
                    TriggerDebouncedCheck();
                }
            };

            StartButton.Click += async (s, e) => await StartConfigurationAsync();
            EnvActionButton.Click += async (s, e) => await HandleEnvActionAsync();
            EnvSecondaryButton.Click += async (s, e) => await InstallCodexCliAsync();
            LaunchAppButton.Click += (s, e) => LaunchTargetApplication();
            BackDoneButton.Click += (s, e) => ShowPage("Connect");
            CloseDoneButton.Click += (s, e) => Window.Close();
            RetryButton.Click += (s, e) => ShowPage("Connect");
        }

        private Brush BrushFromHex(string hex)
        {
            return (SolidColorBrush)new BrushConverter().ConvertFromString(hex);
        }

        private void SwitchMode(HelperMode mode)
        {
            // Save current key input per tab
            string currentVal = GetCurrentKey();
            if (currentMode == HelperMode.ClaudeDesktop) claudeKeyInputCache = currentVal;
            else codexKeyInputCache = currentVal;

            currentMode = mode;
            lastCheckedKey = "";
            KeyInfoText.Visibility = Visibility.Collapsed;

            TabClaudeBtn.ApplyTemplate();
            TabCodexBtn.ApplyTemplate();
            TabClaudeIcon = (System.Windows.Shapes.Path)TabClaudeBtn.Template.FindName("TabClaudeIcon", TabClaudeBtn);
            TabClaudeText = (TextBlock)TabClaudeBtn.Template.FindName("TabClaudeText", TabClaudeBtn);
            TabCodexIcon = (System.Windows.Shapes.Path)TabCodexBtn.Template.FindName("TabCodexIcon", TabCodexBtn);
            TabCodexText = (TextBlock)TabCodexBtn.Template.FindName("TabCodexText", TabCodexBtn);

            if (mode == HelperMode.ClaudeDesktop)
            {
                TabClaudeBorder.Background = BrushFromHex("#27272A");
                TabClaudeBorder.BorderBrush = BrushFromHex("#3F3F46");
                if (TabClaudeIcon != null) TabClaudeIcon.Fill = BrushFromHex("#D97757");
                if (TabClaudeText != null) TabClaudeText.Foreground = BrushFromHex("#F4F4F5");

                TabCodexBorder.Background = Brushes.Transparent;
                TabCodexBorder.BorderBrush = Brushes.Transparent;
                if (TabCodexIcon != null) TabCodexIcon.Fill = BrushFromHex("#71717A");
                if (TabCodexText != null) TabCodexText.Foreground = BrushFromHex("#A1A1AA");

                KeyLabelText.Text = "Mã API Key (Claude Gateway)";
                KeyPlaceholder.Text = "Dán mã API Key Claude vào đây...";
                StartButton.Content = "Kích hoạt Claude Desktop";

                SetCurrentKey(claudeKeyInputCache);
                CheckClaudeDesktopStatus();
            }
            else
            {
                TabCodexBorder.Background = BrushFromHex("#27272A");
                TabCodexBorder.BorderBrush = BrushFromHex("#3F3F46");
                if (TabCodexIcon != null) TabCodexIcon.Fill = BrushFromHex("#10B981");
                if (TabCodexText != null) TabCodexText.Foreground = BrushFromHex("#F4F4F5");

                TabClaudeBorder.Background = Brushes.Transparent;
                TabClaudeBorder.BorderBrush = Brushes.Transparent;
                if (TabClaudeIcon != null) TabClaudeIcon.Fill = BrushFromHex("#71717A");
                if (TabClaudeText != null) TabClaudeText.Foreground = BrushFromHex("#A1A1AA");

                KeyLabelText.Text = "Mã API Key (OpenAI Codex)";
                KeyPlaceholder.Text = "Dán mã API Key Codex (sk-...) vào đây...";
                StartButton.Content = "Kích hoạt OpenAI Codex";

                SetCurrentKey(codexKeyInputCache);
                CheckCodexCliStatus();
            }

            if (!string.IsNullOrWhiteSpace(GetCurrentKey()))
            {
                TriggerDebouncedCheck();
            }
        }

        private void CheckClaudeDesktopStatus()
        {
            cachedClaudeState = FindClaudeDesktop();
            EnvSecondaryButton.Visibility = Visibility.Collapsed;
            if (cachedClaudeState == "running")
            {
                HeaderEnvStatus.Text = "Claude đang chạy";
                HeaderEnvDotBorder.Background = BrushFromHex("#10B981");
                EnvStatusDot.Background = BrushFromHex("#10B981");
                EnvStatusText.Text = "Đã phát hiện Claude Desktop (đang hoạt động)";
                EnvStatusCard.BorderBrush = BrushFromHex("#2E2E34");
                EnvActionButton.Visibility = Visibility.Collapsed;
            }
            else if (cachedClaudeState == "installed")
            {
                HeaderEnvStatus.Text = "Claude sẵn sàng";
                HeaderEnvDotBorder.Background = BrushFromHex("#10B981");
                EnvStatusDot.Background = BrushFromHex("#10B981");
                EnvStatusText.Text = "Đã phát hiện ứng dụng Claude Desktop trên máy";
                EnvStatusCard.BorderBrush = BrushFromHex("#2E2E34");
                EnvActionButton.Visibility = Visibility.Collapsed;
            }
            else
            {
                HeaderEnvStatus.Text = "Chưa cài Claude";
                HeaderEnvDotBorder.Background = BrushFromHex("#F59E0B");
                EnvStatusDot.Background = BrushFromHex("#F59E0B");
                EnvStatusText.Text = "Chưa tìm thấy Claude Desktop trên máy tính";
                EnvStatusCard.BorderBrush = BrushFromHex("#443A1B");
                EnvActionButton.Content = "Tải Claude";
                EnvActionButton.Visibility = Visibility.Visible;
            }
        }

        private void CheckCodexCliStatus()
        {
            cachedCodexPath = FindCodexCli();
            cachedCodexAppState = FindCodexOrChatGptApp();
            bool hasCli = !string.IsNullOrEmpty(cachedCodexPath);
            bool hasApp = cachedCodexAppState != "none";

            if (hasApp || hasCli)
            {
                HeaderEnvStatus.Text = cachedCodexAppState == "running" ? "Codex đang chạy" : "Codex sẵn sàng";
                HeaderEnvDotBorder.Background = BrushFromHex("#10B981");
                EnvStatusDot.Background = BrushFromHex("#10B981");
                EnvStatusCard.BorderBrush = BrushFromHex("#2E2E34");
                EnvActionButton.Visibility = Visibility.Collapsed;
                EnvSecondaryButton.Visibility = Visibility.Collapsed;

                if (hasApp && hasCli)
                {
                    EnvStatusText.Text = "Đã phát hiện App ChatGPT/Codex & CLI (" + Path.GetFileName(cachedCodexPath) + ")";
                }
                else if (hasApp)
                {
                    EnvStatusText.Text = cachedCodexAppState == "running"
                        ? "Đã phát hiện App ChatGPT / Codex (đang chạy)"
                        : "Đã phát hiện App ChatGPT / Codex trên máy";
                }
                else
                {
                    EnvStatusText.Text = "Đã tìm thấy Codex CLI (" + Path.GetFileName(cachedCodexPath) + ")";
                }
            }
            else
            {
                HeaderEnvStatus.Text = "Chưa có Codex";
                HeaderEnvDotBorder.Background = BrushFromHex("#F59E0B");
                EnvStatusDot.Background = BrushFromHex("#F59E0B");
                EnvStatusText.Text = "Chưa tìm thấy App ChatGPT/Codex hoặc CLI";
                EnvStatusCard.BorderBrush = BrushFromHex("#443A1B");
                EnvActionButton.Content = "Tải App";
                EnvActionButton.Visibility = Visibility.Visible;
                EnvSecondaryButton.Content = "Cài CLI";
                EnvSecondaryButton.Visibility = Visibility.Visible;
            }
        }

        private async Task HandleEnvActionAsync()
        {
            if (currentMode == HelperMode.ClaudeDesktop)
            {
                try { Process.Start("https://claude.com/download"); } catch { }
            }
            else
            {
                try { Process.Start("https://openai.com/chatgpt/download/"); } catch { }
                await Task.CompletedTask;
            }
        }

        private void TogglePasswordVisibility()
        {
            if (!isKeyVisible)
            {
                KeyVisible.Text = KeyPassword.Password;
                KeyPassword.Visibility = Visibility.Collapsed;
                KeyVisible.Visibility = Visibility.Visible;
                ToggleKey.Content = "Ẩn";
                isKeyVisible = true;
                KeyVisible.Focus();
                KeyVisible.CaretIndex = KeyVisible.Text.Length;
            }
            else
            {
                KeyPassword.Password = KeyVisible.Text;
                KeyVisible.Visibility = Visibility.Collapsed;
                KeyPassword.Visibility = Visibility.Visible;
                ToggleKey.Content = "Hiện";
                isKeyVisible = false;
                KeyPassword.Focus();
            }
            UpdatePlaceholder();
        }

        private void PasteFromClipboard()
        {
            try
            {
                if (Clipboard.ContainsText())
                {
                    string text = Clipboard.GetText().Trim().Replace("\r", "").Replace("\n", "");
                    SetCurrentKey(text);
                }
            }
            catch { }
        }

        private void SetCurrentKey(string value)
        {
            string clean = value ?? "";
            KeyPassword.Password = clean;
            KeyVisible.Text = clean;
            UpdatePlaceholder();
        }

        private string GetCurrentKey()
        {
            return (isKeyVisible ? KeyVisible.Text : KeyPassword.Password).Trim();
        }

        private void UpdatePlaceholder()
        {
            string val = GetCurrentKey();
            KeyPlaceholder.Visibility = string.IsNullOrEmpty(val) ? Visibility.Visible : Visibility.Collapsed;
        }

        private void TriggerDebouncedCheck()
        {
            checkKeyTimer.Stop();
            string key = GetCurrentKey();
            if (string.IsNullOrEmpty(key) || key.Length < 8)
            {
                KeyInfoText.Visibility = Visibility.Collapsed;
                lastCheckedKey = "";
                return;
            }
            checkKeyTimer.Start();
        }

        private async Task TriggerLiveKeyCheckAsync()
        {
            string key = GetCurrentKey();
            if (string.IsNullOrEmpty(key) || key == lastCheckedKey) return;
            lastCheckedKey = key;
            HelperMode modeSnapshot = currentMode;

            KeyInfoText.Text = "Đang kiểm tra hạn mức Key...";
            KeyInfoText.Foreground = BrushFromHex("#A1A1AA");
            KeyInfoText.Visibility = Visibility.Visible;

            TokenVerifyResult res = await Task.Run(() =>
                modeSnapshot == HelperMode.ClaudeDesktop
                    ? VerifyClaudeKey(key)
                    : VerifyCodexToken(key));

            if (currentMode != modeSnapshot || GetCurrentKey() != key) return;

            if (res.IsProfileToken)
            {
                KeyInfoText.Text = "Mã Profile (" + res.TokenName + ") - Vui lòng lấy API Key sk-... ở tab Tokens";
                KeyInfoText.Foreground = BrushFromHex("#FBBF24");
            }
            else if (res.Success)
            {
                string display = string.IsNullOrEmpty(res.QuotaInfo)
                    ? ("Key hợp lệ: " + res.TokenName)
                    : (res.TokenName + " • " + res.QuotaInfo);
                KeyInfoText.Text = display;
                KeyInfoText.Foreground = BrushFromHex("#34D399");
            }
            else
            {
                KeyInfoText.Text = res.ErrorMessage ?? "API Key không hợp lệ";
                KeyInfoText.Foreground = BrushFromHex("#F87171");
            }
        }

        private void ShowPage(string pageName)
        {
            PageConnect.Visibility = pageName == "Connect" ? Visibility.Visible : Visibility.Collapsed;
            PageProgress.Visibility = pageName == "Progress" ? Visibility.Visible : Visibility.Collapsed;
            PageDone.Visibility = pageName == "Done" ? Visibility.Visible : Visibility.Collapsed;
            PageError.Visibility = pageName == "Error" ? Visibility.Visible : Visibility.Collapsed;
        }

        private void AddActivityItem(string text, string status)
        {
            StackPanel row = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Margin = new Thickness(0, 2, 0, 2)
            };

            string symbol = status == "ok" ? "✓" : (status == "error" ? "✕" : "•");
            string color = status == "ok" ? "#34D399" : (status == "error" ? "#F87171" : "#38BDF8");

            TextBlock iconBlock = new TextBlock
            {
                Text = symbol,
                FontSize = 11,
                FontWeight = FontWeights.Bold,
                Foreground = BrushFromHex(color),
                Width = 16
            };

            TextBlock msgBlock = new TextBlock
            {
                Text = text,
                FontSize = 11,
                Foreground = BrushFromHex("#D4D4D8"),
                TextTrimming = TextTrimming.CharacterEllipsis
            };

            row.Children.Add(iconBlock);
            row.Children.Add(msgBlock);
            ActivityList.Children.Add(row);
        }

        private async Task StartConfigurationAsync()
        {
            string key = GetCurrentKey();
            if (string.IsNullOrEmpty(key))
            {
                MessageBox.Show("Vui lòng dán mã API Key trước khi bấm Kích hoạt.", "DaiTruong-helper", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            HelperMode activeMode = currentMode;
            ShowPage("Progress");
            ActivityList.Children.Clear();
            ProgressBarCtrl.Value = 15;
            ProgressStatusText.Text = "Đang kiểm tra tính hợp lệ của API Key...";
            AddActivityItem("Xác thực API Key & kiểm tra hạn mức hệ thống...", "run");

            TokenVerifyResult verify = await Task.Run(() =>
                activeMode == HelperMode.ClaudeDesktop
                    ? VerifyClaudeKey(key)
                    : VerifyCodexToken(key));

            if (verify.IsProfileToken)
            {
                ShowPage("Connect");
                MessageBoxResult r = MessageBox.Show(
                    "Mã bạn vừa nhập là Access Token tài khoản của '" + verify.TokenName + "' (lấy ở trang Profile).\n\n" +
                    "Để Codex CLI hoạt động, bạn cần sử dụng mã API Key (dạng sk-... hoặc key trong tab 'Mã khoá / Tokens').\n\n" +
                    "Bạn có muốn mở trang Tra Cứu Đơn của DaiTruong Store để lấy mã API Key không?",
                    "Cần mã API Key (không phải mã Profile)",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Warning);
                if (r == MessageBoxResult.Yes)
                {
                    try { Process.Start("https://daitruongstore.fly.dev/lookup"); } catch { }
                }
                return;
            }

            if (!verify.Success)
            {
                ErrorTitleText.Text = "Xác thực API Key không thành công";
                ErrorDetailText.Text = verify.ErrorMessage ?? "Không thể xác minh API Key với hệ thống.";
                ShowPage("Error");
                return;
            }

            ActivityList.Children.Clear();
            string quotaSummary = string.IsNullOrEmpty(verify.QuotaInfo) ? verify.TokenName : (verify.TokenName + " (" + verify.QuotaInfo + ")");
            AddActivityItem("Xác thực Key hợp lệ: " + quotaSummary, "ok");

            try
            {
                if (activeMode == HelperMode.ClaudeDesktop)
                {
                    ProgressStatusText.Text = "Đang cấu hình Claude Desktop Gateway...";
                    await Task.Run(() => ApplyClaudeConfiguration(key, (msg, pct) =>
                    {
                        Window.Dispatcher.Invoke(() =>
                        {
                            AddActivityItem(msg, "ok");
                            ProgressBarCtrl.Value = pct;
                        });
                    }));

                    DoneModeText.Text = "Claude Desktop Gateway";
                    VerifiedKeyNameText.Text = quotaSummary;
                    DoneModelText.Text = "Claude Opus 5.5 & Sonnet 5.5";
                    LaunchAppButton.Content = "Mở Claude Desktop";
                    CheckClaudeDesktopStatus();
                }
                else
                {
                    ProgressStatusText.Text = "Đang thiết lập file cấu hình OpenAI Codex...";
                    await Task.Run(() => ApplyCodexConfiguration(key, (msg, pct) =>
                    {
                        Window.Dispatcher.Invoke(() =>
                        {
                            AddActivityItem(msg, "ok");
                            ProgressBarCtrl.Value = pct;
                        });
                    }));

                    CheckCodexCliStatus();
                    DoneModeText.Text = "OpenAI Codex CLI & App";
                    VerifiedKeyNameText.Text = quotaSummary;
                    DoneModelText.Text = "gpt-6.1-sol (DaiTruong Store)";
                    LaunchAppButton.Content = cachedCodexAppState != "none"
                        ? "Mở App ChatGPT / Codex"
                        : (!string.IsNullOrEmpty(cachedCodexPath) ? "Mở Codex CLI" : "Tải App ChatGPT / Codex");
                }

                await Task.Delay(250);
                ShowPage("Done");
            }
            catch (Exception ex)
            {
                ErrorTitleText.Text = "Cấu hình không thành công";
                ErrorDetailText.Text = ex.Message;
                ShowPage("Error");
            }
        }

        // ====================================================================
        // CLAUDE DESKTOP VERIFICATION & CONFIGURATION
        // ====================================================================
        public static TokenVerifyResult VerifyClaudeKey(string apiKey)
        {
            TokenVerifyResult res = new TokenVerifyResult();
            try
            {
                string cleanKey = (apiKey ?? "").Trim();
                string payload = "{\"apiKey\":\"" + cleanKey.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";

                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("https://genzshop.vn/api/check-usage.php");
                req.Method = "POST";
                req.ContentType = "application/json";
                req.Accept = "application/json, text/plain, */*";
                req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
                req.Referer = "https://genzshop.vn/check-usage";
                req.Headers["Origin"] = "https://genzshop.vn";
                req.Headers["X-Requested-With"] = "XMLHttpRequest";
                req.Timeout = 12000;
                req.ReadWriteTimeout = 12000;

                byte[] bodyBytes = Encoding.UTF8.GetBytes(payload);
                req.ContentLength = bodyBytes.Length;
                using (Stream reqStream = req.GetRequestStream())
                {
                    reqStream.Write(bodyBytes, 0, bodyBytes.Length);
                }

                string rawJson = "";
                try
                {
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    using (StreamReader reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                    {
                        rawJson = reader.ReadToEnd();
                    }
                }
                catch (WebException wex)
                {
                    if (wex.Response != null)
                    {
                        using (StreamReader reader = new StreamReader(wex.Response.GetResponseStream(), Encoding.UTF8))
                        {
                            rawJson = reader.ReadToEnd();
                        }
                    }
                    else
                    {
                        res.Success = false;
                        res.ErrorMessage = "Không thể kết nối máy chủ kiểm tra: " + wex.Message;
                        return res;
                    }
                }

                if (string.IsNullOrWhiteSpace(rawJson))
                {
                    res.Success = false;
                    res.ErrorMessage = "Máy chủ kiểm tra không phản hồi.";
                    return res;
                }

                string decodedJson = Regex.Unescape(rawJson);
                if (rawJson.Contains("\"success\":false") || rawJson.Contains("\"success\": false"))
                {
                    string err = ExtractJsonValue(decodedJson, "error");
                    if (string.IsNullOrEmpty(err)) err = ExtractJsonValue(decodedJson, "message");
                    res.Success = false;
                    res.ErrorMessage = string.IsNullOrEmpty(err) ? "API Key không hợp lệ hoặc chưa kích hoạt." : err;
                    return res;
                }

                double totalCost = ExtractJsonNumber(rawJson, "totalCost");
                double costLimit = ExtractJsonNumber(rawJson, "costLimit");
                double dailyUsed = ExtractJsonNumber(rawJson, "dailyCostUsed");
                double dailyLimit = ExtractJsonNumber(rawJson, "dailyCostLimit");
                double fallbackPct = ExtractJsonNumber(rawJson, "fallbackRemainPercent");

                if (costLimit > 0 && totalCost >= costLimit)
                {
                    res.Success = false;
                    res.ErrorMessage = string.Format("API Key đã hết hạn mức (${0:F2} / ${1:F2}).", totalCost, costLimit);
                    return res;
                }

                if (dailyLimit > 0 && dailyUsed >= dailyLimit)
                {
                    res.Success = false;
                    res.ErrorMessage = string.Format("API Key đã hết hạn mức ngày (${0:F2} / ${1:F2}).", dailyUsed, dailyLimit);
                    return res;
                }

                if (rawJson.Contains("fallbackRemainPercent") && fallbackPct <= 0 && costLimit <= 0)
                {
                    res.Success = false;
                    res.ErrorMessage = "API Key đã hết hạn mức (Còn lại 0%).";
                    return res;
                }

                res.Success = true;
                res.TokenName = "Claude Gateway Key";
                if (costLimit > 0)
                {
                    double remUsd = Math.Max(0.0, costLimit - totalCost);
                    double remPct = Math.Max(0.0, ((costLimit - totalCost) / costLimit) * 100.0);
                    res.QuotaInfo = string.Format("Còn ${0:F2} / ${1:F2} ({2:F1}%)", remUsd, costLimit, remPct);
                }
                else
                {
                    res.QuotaInfo = "Đang hoạt động";
                }
                return res;
            }
            catch (Exception ex)
            {
                res.Success = false;
                res.ErrorMessage = "Lỗi kiểm tra Key: " + ex.Message;
                return res;
            }
        }

        private void ApplyClaudeConfiguration(string apiKey, Action<string, int> progress)
        {
            string cleanKey = apiKey.Trim();
            if (cleanKey.Contains("\r") || cleanKey.Contains("\n"))
                throw new Exception("Mã API Key phải nằm trên 1 dòng.");

            // 1. Backup & clear any locked GPO Registry Policy in HKCU\SOFTWARE\Policies\Claude
            //    so Claude Desktop runs in unlocked 'local' mode (managedKeys: []) and allows full user customization in Third-party settings!
            string backupDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "DaiTruongHelper", "backups");
            Directory.CreateDirectory(backupDir);

            ClearLockedClaudeRegistryPolicy(backupDir);
            progress("Mở khóa GPO Policy (Cho phép tùy chỉnh Third-party tự do)", 35);

            // 2. Write user-editable ConfigLibrary profile in %LOCALAPPDATA%\Claude-3p\configLibrary
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string claude3pDir = Path.Combine(localAppData, "Claude-3p");
            WriteEditableClaudeConfigLibrary(claude3pDir, cleanKey, backupDir);

            // Also sync to %APPDATA%\Claude-3p if that directory exists
            string roamingClaude3p = Path.Combine(appData, "Claude-3p");
            if (Directory.Exists(roamingClaude3p))
            {
                WriteEditableClaudeConfigLibrary(roamingClaude3p, cleanKey, backupDir);
            }
            progress("Ghi cấu hình Gateway & mở khóa Import/Export Chat", 75);

            // 3. Ensure deploymentMode = "3p" in claude_desktop_config.json files
            EnsureClaude3pDeploymentMode(localAppData, appData);

            // 4. Enable Developer Mode in developer_settings.json (allowDevTools = true)
            EnableClaudeDeveloperMode(localAppData, appData);
            progress("Bật chế độ Developer Mode (allowDevTools)", 88);

            // 5. Auto restart Claude Desktop if running
            RestartClaudeDesktop();
            progress("Đồng bộ và làm mới ứng dụng Claude Desktop", 100);
        }

        private void EnableClaudeDeveloperMode(string localAppData, string appData)
        {
            UTF8Encoding utf8NoBom = new UTF8Encoding(false);
            List<string> userDataDirs = new List<string>
            {
                Path.Combine(localAppData, "Claude-3p")
            };

            string roamingClaude = Path.Combine(appData, "Claude");
            if (Directory.Exists(roamingClaude)) userDataDirs.Add(roamingClaude);

            string roamingClaude3p = Path.Combine(appData, "Claude-3p");
            if (Directory.Exists(roamingClaude3p)) userDataDirs.Add(roamingClaude3p);

            string localClaude = Path.Combine(localAppData, "Claude");
            if (Directory.Exists(localClaude)) userDataDirs.Add(localClaude);

            string claudeDataDir = Path.Combine(localAppData, "Claude-Data");
            if (Directory.Exists(claudeDataDir))
            {
                foreach (string sub in Directory.GetDirectories(claudeDataDir))
                {
                    userDataDirs.Add(sub);
                }
            }

            foreach (string dir in userDataDirs)
            {
                try
                {
                    Directory.CreateDirectory(dir);
                    string devPath = Path.Combine(dir, "developer_settings.json");
                    if (!File.Exists(devPath))
                    {
                        File.WriteAllText(devPath, "{\r\n  \"allowDevTools\": true\r\n}", utf8NoBom);
                        continue;
                    }

                    string raw = File.ReadAllText(devPath, Encoding.UTF8);
                    if (Regex.IsMatch(raw, "\"allowDevTools\"\\s*:\\s*true"))
                        continue;

                    string updated;
                    if (Regex.IsMatch(raw, "\"allowDevTools\"\\s*:\\s*(?:true|false|null)"))
                    {
                        updated = Regex.Replace(raw, "\"allowDevTools\"\\s*:\\s*(?:true|false|null)", "\"allowDevTools\": true");
                    }
                    else
                    {
                        int lastBrace = raw.LastIndexOf('}');
                        if (lastBrace > 0 && raw.Substring(0, lastBrace).Trim().Length > 1)
                            updated = raw.Substring(0, lastBrace).TrimEnd() + ",\r\n  \"allowDevTools\": true\r\n}";
                        else
                            updated = "{\r\n  \"allowDevTools\": true\r\n}";
                    }
                    File.WriteAllText(devPath, updated, utf8NoBom);
                }
                catch { }
            }
        }

        private void ClearLockedClaudeRegistryPolicy(string backupDir)
        {
            try
            {
                using (RegistryKey existing = Registry.CurrentUser.OpenSubKey(CLAUDE_POLICY_SUBKEY, false))
                {
                    if (existing == null || existing.ValueCount == 0)
                        return;

                    StringBuilder backupJson = new StringBuilder();
                    backupJson.Append("{\"version\":1,\"capturedAt\":\"").Append(DateTime.UtcNow.ToString("o")).Append("\",\"entries\":[");
                    for (int i = 0; i < CLAUDE_MANAGED_KEYS.Length; i++)
                    {
                        string k = CLAUDE_MANAGED_KEYS[i];
                        object valObj = existing.GetValue(k, null);
                        bool exists = valObj != null;
                        string valStr = exists ? Convert.ToString(valObj).Replace("\\", "\\\\").Replace("\"", "\\\"") : "";
                        if (i > 0) backupJson.Append(",");
                        backupJson.Append("{\"name\":\"").Append(k).Append("\",\"exists\":").Append(exists ? "true" : "false").Append(",\"value\":\"").Append(valStr).Append("\"}");
                    }
                    backupJson.Append("]}");

                    byte[] plainBytes = Encoding.UTF8.GetBytes(backupJson.ToString());
                    byte[] encryptedBytes = ProtectedData.Protect(plainBytes, null, DataProtectionScope.CurrentUser);
                    string backupFile = Path.Combine(backupDir, DateTime.Now.ToString("yyyyMMdd_HHmmss_fff") + ".dpapi");
                    File.WriteAllBytes(backupFile, encryptedBytes);
                }

                using (RegistryKey writable = Registry.CurrentUser.OpenSubKey(CLAUDE_POLICY_SUBKEY, true))
                {
                    if (writable != null)
                    {
                        foreach (string valName in writable.GetValueNames())
                        {
                            writable.DeleteValue(valName, false);
                        }
                    }
                }
            }
            catch
            {
                // If HKCU\SOFTWARE\Policies\Claude is locked by Admin ACL, clear its values via elevated PowerShell
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command \"if (Test-Path 'HKCU:\\SOFTWARE\\Policies\\Claude') { Remove-ItemProperty -Path 'HKCU:\\SOFTWARE\\Policies\\Claude' -Name * -ErrorAction SilentlyContinue }\"",
                        Verb = "runas",
                        UseShellExecute = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    using (Process p = Process.Start(psi))
                    {
                        if (p != null) p.WaitForExit(10000);
                    }
                }
                catch { }
            }
        }

        private void WriteEditableClaudeConfigLibrary(string claude3pDir, string cleanKey, string backupDir)
        {
            string libDir = Path.Combine(claude3pDir, "configLibrary");
            Directory.CreateDirectory(libDir);

            string cfgId = "d1000000-0000-4000-8000-000000000001";
            string metaPath = Path.Combine(libDir, "_meta.json");
            string profilePath = Path.Combine(libDir, cfgId + ".json");
            UTF8Encoding utf8NoBom = new UTF8Encoding(false);

            if (File.Exists(profilePath))
            {
                string stamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                File.Copy(profilePath, Path.Combine(backupDir, "claude3p_" + stamp + ".json"), true);
            }

            string metaJson = "{\"appliedId\":\"" + cfgId + "\",\"entries\":[{\"id\":\"" + cfgId + "\",\"name\":\"DaiTruong Gateway\"}]}";
            File.WriteAllText(metaPath, metaJson, utf8NoBom);

            string escapedKey = cleanKey.Replace("\\", "\\\\").Replace("\"", "\\\"");
            string escapedUrl = CLAUDE_GATEWAY_URL.Replace("\\", "\\\\").Replace("\"", "\\\"");

            string profileJson =
"{\r\n" +
"  \"inferenceProvider\": \"gateway\",\r\n" +
"  \"inferenceCredentialKind\": \"static\",\r\n" +
"  \"inferenceGatewayBaseUrl\": \"" + escapedUrl + "\",\r\n" +
"  \"inferenceGatewayApiKey\": \"" + escapedKey + "\",\r\n" +
"  \"inferenceGatewayAuthScheme\": \"" + CLAUDE_AUTH_SCHEME + "\",\r\n" +
"  \"desktopHome\": \"standard\",\r\n" +
"  \"developerModeEnabled\": true,\r\n" +
"  \"claudeAiImport\": {\r\n" +
"    \"enabled\": true,\r\n" +
"    \"exportEnabled\": true,\r\n" +
"    \"bannerBehavior\": \"show\"\r\n" +
"  }\r\n" +
"}";
            File.WriteAllText(profilePath, profileJson, utf8NoBom);
        }

        private void EnsureClaude3pDeploymentMode(string localAppData, string appData)
        {
            UTF8Encoding utf8NoBom = new UTF8Encoding(false);
            List<string> configTargets = new List<string>
            {
                Path.Combine(localAppData, @"Claude-3p\claude_desktop_config.json"),
                Path.Combine(localAppData, @"Claude\claude_desktop_config.json"),
                Path.Combine(appData, @"Claude\claude_desktop_config.json")
            };

            string claudeDataDir = Path.Combine(localAppData, "Claude-Data");
            if (Directory.Exists(claudeDataDir))
            {
                foreach (string sub in Directory.GetDirectories(claudeDataDir))
                {
                    configTargets.Add(Path.Combine(sub, "claude_desktop_config.json"));
                }
            }

            foreach (string cfgPath in configTargets)
            {
                try
                {
                    if (!File.Exists(cfgPath))
                    {
                        if (cfgPath.Contains("Claude-3p"))
                        {
                            Directory.CreateDirectory(Path.GetDirectoryName(cfgPath));
                            File.WriteAllText(cfgPath, "{\r\n  \"deploymentMode\": \"3p\"\r\n}", utf8NoBom);
                        }
                        continue;
                    }

                    string raw = File.ReadAllText(cfgPath, Encoding.UTF8);
                    if (Regex.IsMatch(raw, "\"deploymentMode\"\\s*:\\s*\"3p\""))
                        continue;

                    string updated;
                    if (Regex.IsMatch(raw, "\"deploymentMode\"\\s*:\\s*\"[^\"]*\""))
                    {
                        updated = Regex.Replace(raw, "\"deploymentMode\"\\s*:\\s*\"[^\"]*\"", "\"deploymentMode\": \"3p\"");
                    }
                    else
                    {
                        int lastBrace = raw.LastIndexOf('}');
                        if (lastBrace <= 0) continue;
                        updated = raw.Substring(0, lastBrace).TrimEnd() + ",\r\n  \"deploymentMode\": \"3p\"\r\n}";
                    }
                    File.WriteAllText(cfgPath, updated, utf8NoBom);
                }
                catch { }
            }
        }

        private string FindClaudeDesktop()
        {
            try
            {
                Process[] procs = Process.GetProcesses();
                foreach (Process p in procs)
                {
                    try
                    {
                        string pn = p.ProcessName.ToLowerInvariant();
                        if (pn.Contains("claude") && !pn.Contains("helper") && !pn.Contains("gateway") && !pn.Contains("code"))
                            return "running";
                    }
                    catch { }
                }

                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string progFiles86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

                string[] paths = new string[]
                {
                    Path.Combine(localAppData, @"Programs\Claude\Claude.exe"),
                    Path.Combine(localAppData, @"Microsoft\WindowsApps\claude-desktop.exe"),
                    Path.Combine(localAppData, @"Claude"),
                    Path.Combine(progFiles, @"Claude\Claude.exe"),
                    Path.Combine(progFiles86, @"Claude\Claude.exe")
                };

                foreach (string p in paths)
                {
                    if (File.Exists(p) || Directory.Exists(p)) return "installed";
                }

                string pkgDir = Path.Combine(localAppData, "Packages");
                if (Directory.Exists(pkgDir))
                {
                    string[] dirs = Directory.GetDirectories(pkgDir, "*Claude*");
                    if (dirs.Length > 0) return "installed";
                }
            }
            catch { }
            return "none";
        }

        private bool RestartClaudeDesktop()
        {
            try
            {
                foreach (Process p in Process.GetProcesses())
                {
                    try
                    {
                        string pn = p.ProcessName.ToLowerInvariant();
                        if (pn.Contains("claude") && !pn.Contains("helper") && !pn.Contains("gateway") && !pn.Contains("code"))
                        {
                            p.Kill();
                        }
                    }
                    catch { }
                }

                System.Threading.Thread.Sleep(900);
                return LaunchClaudeDesktopProcess();
            }
            catch
            {
                return false;
            }
        }

        private bool LaunchClaudeDesktopProcess()
        {
            try
            {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string progFiles86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

                string[] candidates = new string[]
                {
                    Path.Combine(localAppData, @"Microsoft\WindowsApps\claude.exe"),
                    Path.Combine(localAppData, @"Microsoft\WindowsApps\claude-desktop.exe"),
                    Path.Combine(localAppData, @"Programs\Claude\Claude.exe"),
                    Path.Combine(progFiles, @"Claude\Claude.exe"),
                    Path.Combine(progFiles86, @"Claude\Claude.exe")
                };

                foreach (string exe in candidates)
                {
                    if (File.Exists(exe))
                    {
                        Process.Start(new ProcessStartInfo(exe) { UseShellExecute = true });
                        return true;
                    }
                }

                string pkgDir = Path.Combine(localAppData, "Packages");
                if (Directory.Exists(pkgDir) && Directory.GetDirectories(pkgDir, "*Claude*").Length > 0)
                {
                    Process.Start(new ProcessStartInfo("explorer.exe", @"shell:AppsFolder\Claude_pzs8sxrjxfjjc!Claude") { UseShellExecute = true });
                    return true;
                }
            }
            catch { }
            return false;
        }

        // ====================================================================
        // OPENAI CODEX VERIFICATION & CONFIGURATION
        // ====================================================================
        public static TokenVerifyResult VerifyCodexToken(string token)
        {
            TokenVerifyResult res = new TokenVerifyResult();
            string clean = (token ?? "").Trim();

            // 1. Check if token is a Profile token via /api/user/self
            try
            {
                HttpWebRequest selfReq = (HttpWebRequest)WebRequest.Create("https://modelapi.vn/api/user/self");
                selfReq.Method = "GET";
                selfReq.Headers["Authorization"] = "Bearer " + clean;
                selfReq.UserAgent = "Mozilla/5.0";
                selfReq.Timeout = 7000;

                using (HttpWebResponse selfResp = (HttpWebResponse)selfReq.GetResponse())
                using (StreamReader reader = new StreamReader(selfResp.GetResponseStream(), Encoding.UTF8))
                {
                    string selfJson = reader.ReadToEnd();
                    if (selfJson.Contains("\"success\":true") && selfJson.Contains("\"username\""))
                    {
                        string user = ExtractJsonValue(selfJson, "display_name");
                        if (string.IsNullOrEmpty(user)) user = ExtractJsonValue(selfJson, "username");
                        if (user != null && user.ToLowerInvariant() != "namnoname")
                        {
                            res.IsProfileToken = true;
                            res.TokenName = user;
                            return res;
                        }
                    }
                }
            }
            catch { }

            // 2. Check token quota on modelapi.vn
            string[] endpoints = new string[]
            {
                "https://modelapi.vn/api/usage/token/",
                "https://api.modelapi.vn/api/usage/token/"
            };

            foreach (string url in endpoints)
            {
                try
                {
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                    req.Method = "GET";
                    req.Headers["Authorization"] = "Bearer " + clean;
                    req.UserAgent = "Mozilla/5.0";
                    req.Timeout = 8000;

                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    using (StreamReader reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                    {
                        string json = reader.ReadToEnd();
                        if (json.Contains("\"code\":true") || json.Contains("\"success\":true"))
                        {
                            string name = ExtractJsonValue(json, "name");
                            double remainQuota = ExtractJsonNumber(json, "total_available");
                            if (remainQuota <= 0) remainQuota = ExtractJsonNumber(json, "remain_quota");
                            double usd = remainQuota / 500000.0;

                            res.Success = true;
                            res.TokenName = string.IsNullOrEmpty(name) ? "Codex AI Key" : name;
                            res.QuotaInfo = remainQuota > 0 ? string.Format("Số dư: ${0:F2}", usd) : "Đang hoạt động";
                            return res;
                        }
                    }
                }
                catch { }
            }

            // 3. Fallback check against /v1/models
            try
            {
                HttpWebRequest mReq = (HttpWebRequest)WebRequest.Create("https://api.modelapi.vn/v1/models");
                mReq.Method = "GET";
                mReq.Headers["Authorization"] = "Bearer " + clean;
                mReq.UserAgent = "Mozilla/5.0";
                mReq.Timeout = 8000;

                using (HttpWebResponse mResp = (HttpWebResponse)mReq.GetResponse())
                {
                    if (mResp.StatusCode == HttpStatusCode.OK)
                    {
                        res.Success = true;
                        res.TokenName = "Codex AI Key Hợp Lệ";
                        res.QuotaInfo = "Sẵn sàng";
                        return res;
                    }
                }
            }
            catch (WebException wex)
            {
                HttpWebResponse httpResp = wex.Response as HttpWebResponse;
                if (httpResp != null)
                {
                    if (httpResp.StatusCode == HttpStatusCode.Unauthorized || httpResp.StatusCode == HttpStatusCode.Forbidden)
                    {
                        res.Success = false;
                        res.ErrorMessage = "Mã API Key Codex không hợp lệ hoặc đã hết hạn.";
                        return res;
                    }
                }
            }
            catch { }

            res.Success = false;
            res.ErrorMessage = "Mã không hợp lệ hoặc không thể kết nối máy chủ xác thực.";
            return res;
        }

        private void ApplyCodexConfiguration(string token, Action<string, int> progress)
        {
            string codexHome = Environment.GetEnvironmentVariable("CODEX_HOME");
            if (string.IsNullOrWhiteSpace(codexHome))
            {
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                codexHome = Path.Combine(userProfile, ".codex");
            }

            Directory.CreateDirectory(codexHome);
            progress("Kiểm tra và chuẩn bị thư mục ~/.codex", 35);

            string configPath = Path.Combine(codexHome, "config.toml");
            string authPath = Path.Combine(codexHome, "auth.json");
            string stamp = DateTime.Now.ToString("yyyyMMdd-HHmmss");

            if (File.Exists(configPath))
            {
                File.Copy(configPath, configPath + ".daitruong-backup-" + stamp, true);
            }
            if (File.Exists(authPath))
            {
                File.Copy(authPath, authPath + ".daitruong-backup-" + stamp, true);
            }

            UTF8Encoding utf8NoBom = new UTF8Encoding(false);
            File.WriteAllText(configPath, EXACT_CONFIG_TOML, utf8NoBom);
            progress("Ghi cấu hình chuẩn (gpt-6.1-sol, DaiTruong Store)", 65);

            string safeToken = token.Trim().Replace("\\", "\\\\").Replace("\"", "\\\"");
            File.WriteAllText(authPath, "{\"OPENAI_API_KEY\":\"" + safeToken + "\"}", utf8NoBom);
            progress("Ghi API Key vào tệp bảo mật auth.json", 85);

            try
            {
                FileInfo fi = new FileInfo(authPath);
                FileSecurity fs = fi.GetAccessControl();
                fs.SetAccessRuleProtection(true, false);
                SecurityIdentifier currentUser = WindowsIdentity.GetCurrent().User;
                if (currentUser != null)
                {
                    fs.AddAccessRule(new FileSystemAccessRule(
                        currentUser, FileSystemRights.FullControl, AccessControlType.Allow));
                    fi.SetAccessControl(fs);
                }
            }
            catch { }
            progress("Thiết lập quyền bảo mật tệp tin (Windows ACL Protected)", 100);
        }

        private async Task InstallCodexCliAsync()
        {
            string npmPath = FindNpmCli();
            if (string.IsNullOrEmpty(npmPath))
            {
                MessageBoxResult r = MessageBox.Show(
                    "Máy của bạn chưa cài đặt Node.js / npm (môi trường cần thiết để chạy Codex CLI).\n\n" +
                    "Bạn có muốn mở trang tải Node.js chính thức (bản LTS) không?",
                    "Cần cài đặt Node.js",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Information);
                if (r == MessageBoxResult.Yes)
                {
                    try { Process.Start("https://nodejs.org/en/download"); } catch { }
                }
                return;
            }

            EnvSecondaryButton.IsEnabled = false;
            EnvSecondaryButton.Content = "Đang cài...";
            try
            {
                int exitCode = await Task.Run(() =>
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = npmPath,
                        Arguments = "install -g @openai/codex",
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    using (Process p = Process.Start(psi))
                    {
                        p.WaitForExit();
                        return p.ExitCode;
                    }
                });

                CheckCodexCliStatus();
                if (exitCode == 0)
                {
                    MessageBox.Show("Cài đặt Codex CLI thành công!", "DaiTruong-helper", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khi chạy lệnh cài đặt: " + ex.Message, "Lỗi cài đặt", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                EnvSecondaryButton.IsEnabled = true;
                EnvSecondaryButton.Content = "Cài CLI";
            }
        }

        private void LaunchTargetApplication()
        {
            if (currentMode == HelperMode.ClaudeDesktop)
            {
                if (!LaunchClaudeDesktopProcess())
                {
                    try { Process.Start("https://claude.com/download"); } catch { }
                }
                return;
            }

            try
            {
                if (!string.IsNullOrEmpty(cachedCodexAppPackage))
                {
                    Process.Start(new ProcessStartInfo("explorer.exe", @"shell:AppsFolder\" + cachedCodexAppPackage + "!App") { UseShellExecute = true });
                    return;
                }
                if (!string.IsNullOrEmpty(cachedCodexAppExe) && File.Exists(cachedCodexAppExe))
                {
                    Process.Start(new ProcessStartInfo(cachedCodexAppExe) { UseShellExecute = true });
                    return;
                }
                string codexCli = FindCodexCli();
                if (!string.IsNullOrEmpty(codexCli))
                {
                    Process.Start(new ProcessStartInfo("cmd.exe", "/k \"" + codexCli + "\"") { UseShellExecute = true });
                    return;
                }
                Process.Start("https://openai.com/chatgpt/download/");
            }
            catch
            {
                try { Process.Start("https://chatgpt.com"); } catch { }
            }
        }

        private string FindCodexOrChatGptApp()
        {
            cachedCodexAppPackage = null;
            cachedCodexAppExe = null;
            try
            {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string progFiles86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

                string pkgDir = Path.Combine(localAppData, "Packages");
                if (Directory.Exists(pkgDir))
                {
                    string[] patterns = new string[] { "OpenAI.Codex*", "OpenAI.ChatGPT*" };
                    foreach (string pat in patterns)
                    {
                        string[] matches = Directory.GetDirectories(pkgDir, pat);
                        if (matches.Length > 0)
                        {
                            cachedCodexAppPackage = Path.GetFileName(matches[0]);
                            break;
                        }
                    }
                }

                string[] exeCandidates = new string[]
                {
                    Path.Combine(localAppData, @"Microsoft\WindowsApps\Codex.exe"),
                    Path.Combine(localAppData, @"Microsoft\WindowsApps\ChatGPT.exe"),
                    Path.Combine(localAppData, @"Programs\Codex\Codex.exe"),
                    Path.Combine(localAppData, @"Programs\ChatGPT\ChatGPT.exe"),
                    Path.Combine(progFiles, @"OpenAI\Codex\Codex.exe"),
                    Path.Combine(progFiles, @"OpenAI\ChatGPT\ChatGPT.exe"),
                    Path.Combine(progFiles86, @"OpenAI\Codex\Codex.exe"),
                    Path.Combine(progFiles86, @"OpenAI\ChatGPT\ChatGPT.exe")
                };

                foreach (string exe in exeCandidates)
                {
                    if (File.Exists(exe))
                    {
                        cachedCodexAppExe = exe;
                        break;
                    }
                }

                bool installed = !string.IsNullOrEmpty(cachedCodexAppPackage) || !string.IsNullOrEmpty(cachedCodexAppExe);

                foreach (Process p in Process.GetProcesses())
                {
                    try
                    {
                        string pn = p.ProcessName.ToLowerInvariant();
                        if ((pn == "codex" || pn == "chatgpt" || pn.Contains("openai.codex") || pn.Contains("openai.chatgpt")) &&
                            !pn.Contains("helper") && !pn.Contains("gateway"))
                        {
                            return "running";
                        }
                    }
                    catch { }
                }

                if (installed) return "installed";
            }
            catch { }
            return "none";
        }

        private string FindCodexCli()
        {
            try
            {
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

                string[] directCandidates = new string[]
                {
                    Path.Combine(appData, @"npm\codex.cmd"),
                    Path.Combine(appData, @"npm\codex.exe"),
                    Path.Combine(localAppData, @"Programs\OpenAI\Codex\bin\codex.cmd"),
                    Path.Combine(localAppData, @"Programs\OpenAI\Codex\bin\codex.exe")
                };

                foreach (string c in directCandidates)
                {
                    if (File.Exists(c)) return c;
                }

                string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
                foreach (string dir in pathEnv.Split(';'))
                {
                    if (string.IsNullOrWhiteSpace(dir)) continue;
                    string cmd = Path.Combine(dir.Trim(), "codex.cmd");
                    if (File.Exists(cmd)) return cmd;
                    string exe = Path.Combine(dir.Trim(), "codex.exe");
                    if (File.Exists(exe)) return exe;
                }
            }
            catch { }
            return null;
        }

        private string FindNpmCli()
        {
            try
            {
                string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string defaultNpm = Path.Combine(progFiles, @"nodejs\npm.cmd");
                if (File.Exists(defaultNpm)) return defaultNpm;

                string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
                foreach (string dir in pathEnv.Split(';'))
                {
                    if (string.IsNullOrWhiteSpace(dir)) continue;
                    string candidate = Path.Combine(dir.Trim(), "npm.cmd");
                    if (File.Exists(candidate)) return candidate;
                }
            }
            catch { }
            return null;
        }

        private static string ExtractJsonValue(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return null;
            Match m = Regex.Match(json, "\"" + Regex.Escape(key) + "\"\\s*:\\s*\"([^\"]*)\"");
            return m.Success ? m.Groups[1].Value : null;
        }

        private static double ExtractJsonNumber(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return 0.0;
            Match m = Regex.Match(json, "\"" + Regex.Escape(key) + "\"\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)");
            if (m.Success)
            {
                double val;
                if (double.TryParse(m.Groups[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out val))
                    return val;
            }
            return 0.0;
        }
    }
}
