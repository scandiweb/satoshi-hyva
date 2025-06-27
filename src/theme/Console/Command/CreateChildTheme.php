<?php
declare(strict_types=1);

namespace Satoshi\Theme\Console\Command;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Filesystem;
use Magento\Framework\Filesystem\Directory\WriteInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class CreateChildTheme extends Command
{
    private const VENDOR_ARGUMENT = 'vendor';
    private const NAME_ARGUMENT = 'name';

    private Filesystem $filesystem;
    private WriteInterface $directoryWrite;

    public function __construct(
        Filesystem $filesystem
    ) {
        $this->filesystem = $filesystem;
        $this->directoryWrite = $this->filesystem->getDirectoryWrite(DirectoryList::ROOT);
        parent::__construct();
    }

    /**
     * Configure the command
     */
    protected function configure(): void
    {
        $this->setName('satoshi:theme:create-child');
        $this->setDescription('Create a child theme that inherits from Satoshi theme');
        $this->addArgument(
            self::VENDOR_ARGUMENT,
            InputArgument::REQUIRED,
            'Vendor name for the child theme (e.g., MyCompany)'
        );
        $this->addArgument(
            self::NAME_ARGUMENT,
            InputArgument::REQUIRED,
            'Theme name for the child theme (e.g., CustomTheme)'
        );
        
        parent::configure();
    }

    /**
     * Execute the command
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     * @return int
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $exitCode = 0;
        
        try {
            $vendor = $input->getArgument(self::VENDOR_ARGUMENT);
            $name = $input->getArgument(self::NAME_ARGUMENT);
            
            $output->writeln('<info>Creating child theme...</info>');
            $output->writeln(sprintf('<info>Vendor: %s</info>', $vendor));
            $output->writeln(sprintf('<info>Name: %s</info>', $name));
            
            // Implement core theme scaffolding
            $this->createThemeDirectoryStructure($vendor, $name, $output);
            $this->generateThemeXml($vendor, $name, $output);
            $this->generateRegistrationPhp($vendor, $name, $output);
            $this->generateComposerJson($vendor, $name, $output);
            
            // Implement frontend build system scaffolding (Checkpoint 3 - Minimal Approach)
            $this->scaffoldBuildSystem($vendor, $name, $output);
            
            $output->writeln('<info>Child theme created successfully!</info>');
            $output->writeln(sprintf(
                '<comment>Theme location: app/design/frontend/%s/%s</comment>',
                $vendor,
                $name
            ));
            $output->writeln('<comment>Next steps:</comment>');
            $output->writeln('<comment>1. Run: bin/magento setup:upgrade</comment>');
            $output->writeln('<comment>2. Navigate to Admin > Content > Design > Themes to see your new theme</comment>');
            $output->writeln(sprintf('<comment>3. Navigate to build directory: app/design/frontend/%s/%s/web/satoshi</comment>', $vendor, $name));
            $output->writeln('<comment>4. Run: npm install && npm run build</comment>');
            $output->writeln('<comment>5. The build system will automatically detect and inherit from parent Satoshi theme</comment>');
            
        } catch (LocalizedException $e) {
            $output->writeln(sprintf(
                '<error>%s</error>',
                $e->getMessage()
            ));
            $exitCode = 1;
        } catch (\Exception $e) {
            $output->writeln(sprintf(
                '<error>An unexpected error occurred: %s</error>',
                $e->getMessage()
            ));
            $exitCode = 1;
        }
        
        return $exitCode;
    }

    /**
     * Create the theme directory structure (excluding web directory - copied from parent)
     */
    private function createThemeDirectoryStructure(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        
        $output->writeln(sprintf('<info>Creating base theme structure at: %s</info>', $themePath));
        
        // Create main theme directory
        if (!$this->directoryWrite->isDirectory($themePath)) {
            $this->directoryWrite->create($themePath);
        }
        
        $output->writeln('<info>Base structure created</info>');
    }

    /**
     * Generate theme.xml file
     */
    private function generateThemeXml(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        $themeXmlPath = $themePath . '/theme.xml';
        
        $themeXmlContent = $this->getThemeXmlTemplate($name);
        
        $this->directoryWrite->writeFile($themeXmlPath, $themeXmlContent);
        $output->writeln(sprintf('<info>Created theme.xml at: %s</info>', $themeXmlPath));
    }

    /**
     * Generate registration.php file
     */
    private function generateRegistrationPhp(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        $registrationPath = $themePath . '/registration.php';
        
        $registrationContent = $this->getRegistrationPhpTemplate($vendor, $name);
        
        $this->directoryWrite->writeFile($registrationPath, $registrationContent);
        $output->writeln(sprintf('<info>Created registration.php at: %s</info>', $registrationPath));
    }

    /**
     * Generate composer.json file
     */
    private function generateComposerJson(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        $composerPath = $themePath . '/composer.json';
        
        $composerContent = $this->getComposerJsonTemplate($vendor, $name);
        
        $this->directoryWrite->writeFile($composerPath, $composerContent);
        $output->writeln(sprintf('<info>Created composer.json at: %s</info>', $composerPath));
    }

    /**
     * Get theme.xml template content
     */
    private function getThemeXmlTemplate(string $name): string
    {
        return <<<XML
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>{$name}</title>
    <parent>Satoshi/Hyva</parent>
</theme>
XML;
    }

    /**
     * Get registration.php template content
     */
    private function getRegistrationPhpTemplate(string $vendor, string $name): string
    {
        return <<<PHP
<?php
declare(strict_types=1);

\Magento\Framework\Component\ComponentRegistrar::register(
    \Magento\Framework\Component\ComponentRegistrar::THEME,
    'frontend/{$vendor}/{$name}',
    __DIR__
);
PHP;
    }

    /**
     * Get composer.json template content
     */
    private function getComposerJsonTemplate(string $vendor, string $name): string
    {
        $packageName = strtolower($vendor) . '/' . strtolower($name);
        
        return <<<JSON
{
    "name": "{$packageName}",
    "description": "Child theme of Satoshi theme",
    "type": "magento2-theme",
    "version": "1.0.0",
    "license": "OSL-3.0",
    "require": {
        "php": "^8.1",
        "magento/framework": "*"
    },
    "autoload": {
        "files": [
            "registration.php"
        ]
    }
}
JSON;
    }

    /**
     * Scaffold minimal build system with dynamic resolution
     */
    private function scaffoldBuildSystem(string $vendor, string $name, OutputInterface $output): void
    {
        $output->writeln('<info>Setting up build system with dynamic parent resolution...</info>');
        
        // Copy the whole web directory from the parent theme
        $this->copyParentWebDirectory($vendor, $name, $output);
        
        // Generate child tailwind config with inheritance
        $this->generateChildTailwindConfig($vendor, $name, $output);
        
        $output->writeln('<info>✅ Minimal build system scaffolded successfully!</info>');
        $output->writeln('<info>🔧 The child theme will automatically detect and inherit from parent theme</info>');
    }

    /**
     * Copy parent web directory from satoshi-theme source
     */
    private function copyParentWebDirectory(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        
        $output->writeln('<info>Copying parent web directory...</info>');
        
        // Locate parent satoshi-theme web directory
        $parentWebPath = $this->locateParentWebDirectory($output);
        
        if (!$parentWebPath) {
            throw new LocalizedException(__('Could not locate satoshi-theme web directory. Expected in src/satoshi-theme/web or vendor/scandiweb/satoshi/src/satoshi-theme/web'));
        }
        
        // Copy entire web directory to child theme
        $targetWebPath = $themePath . '/web';
        $this->copyDirectoryRecursively($parentWebPath, $targetWebPath, $output);
        $output->writeln(sprintf('<info>Copied web directory to: %s</info>', $targetWebPath));
    }

    /**
     * Locate parent satoshi-theme web directory
     */
    private function locateParentWebDirectory(OutputInterface $output): ?string
    {   
        $vendorPath = 'vendor/scandiweb/satoshi/src/satoshi-theme/web';

        if ($this->directoryWrite->isDirectory($vendorPath)) {
            $output->writeln('<info>Found parent theme in vendor location</info>');
            return $vendorPath;
        }
        
        return null;
    }

    /**
     * Copy directory recursively
     */
    private function copyDirectoryRecursively(string $source, string $destination, OutputInterface $output): void
    {
        // Create destination directory
        if (!$this->directoryWrite->isDirectory($destination)) {
            $this->directoryWrite->create($destination);
        }
        
        // Get all files and subdirectories in source
        $sourceFiles = $this->directoryWrite->read($source);
        
        foreach ($sourceFiles as $file) {
            $file = str_replace($source, '', $file); // Remove source path prefix for relative paths

            $sourceFile = $source . $file;
            $destFile = $destination . $file;
            
            if ($this->directoryWrite->isDirectory($sourceFile)) {
                // Recursively copy subdirectory
                $this->copyDirectoryRecursively($sourceFile, $destFile, $output);
            } else {
                // Copy file
                $content = $this->directoryWrite->readFile($sourceFile);
                $this->directoryWrite->writeFile($destFile, $content);
            }
        }
    }

    /**
     * Generate child tailwind config with dynamic parent detection
     */
    private function generateChildTailwindConfig(string $vendor, string $name, OutputInterface $output): void
    {
        $themePath = sprintf('app/design/frontend/%s/%s', $vendor, $name);
        $tailwindConfigPath = $themePath . '/web/satoshi/tailwind.config.js';
        
        $tailwindConfigContent = $this->getSmartTailwindConfigTemplate();
        
        $this->directoryWrite->writeFile($tailwindConfigPath, $tailwindConfigContent);
        $output->writeln(sprintf('<info>Generated child tailwind.config.js at: %s</info>', $tailwindConfigPath));
    }

    /**
     * Get smart tailwind config template with dynamic parent detection
     */
    private function getSmartTailwindConfigTemplate(): string
    {
        return <<<JS
const { mergeTailwindConfig } = require("@hyva-themes/hyva-modules");
const parentConfig = require("../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi/tailwind.config.js");

/** @type {import('tailwindcss').Config} */
module.exports = mergeTailwindConfig({
    presets: [parentConfig],
    content: [
        // magento2-default-theme
        "../../../../../../../vendor/hyva-themes/magento2-default-theme/**/*.phtml",
        "../../../../../../../vendor/hyva-themes/magento2-default-theme/*/layout/*.xml",
        "../../../../../../../vendor/hyva-themes/magento2-default-theme/*/page_layout/override/base/*.xml",
        // Satoshi theme
        "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/**/*.phtml",
        "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/*/layout/*.xml",
        "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/*/page_layout/override/base/*.xml",

        // this theme's phtml and layout XML files
        "../../**/*.phtml",
        "../../*/layout/*.xml",
        "../../*/page_layout/override/base/*.xml",
        // app/code phtml files (if need tailwind classes from app/code modules)
        "../../../../../../../app/code/**/*.phtml",
    ],
    theme: {
        extend: {
            // Add your custom theme extensions here
        }
    }
});
JS;
    }
} 