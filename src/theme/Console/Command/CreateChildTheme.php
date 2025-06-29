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
    
    private const PARENT_THEME_PATH = 'vendor/scandiweb/satoshi/src/satoshi-theme/web';
    private const THEME_BASE_PATH = 'app/design/frontend';

    private Filesystem $filesystem;
    private WriteInterface $directoryWrite;

    public function __construct(Filesystem $filesystem)
    {
        $this->filesystem = $filesystem;
        $this->directoryWrite = $this->filesystem->getDirectoryWrite(DirectoryList::ROOT);
        parent::__construct();
    }

    protected function configure()
    {
        $this->setName('satoshi:theme:create-child')
            ->setDescription('Create a child theme that inherits from Satoshi theme')
            ->addArgument(
                self::VENDOR_ARGUMENT,
                InputArgument::REQUIRED,
                'Vendor name for the child theme (e.g., MyCompany)'
            )
            ->addArgument(
                self::NAME_ARGUMENT,
                InputArgument::REQUIRED,
                'Theme name for the child theme (e.g., CustomTheme)'
            );
        
        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        try {
            $vendor = $input->getArgument(self::VENDOR_ARGUMENT);
            $name = $input->getArgument(self::NAME_ARGUMENT);
            
            $this->outputIntroduction($output, $vendor, $name);
            $this->createThemeStructure($vendor, $name, $output);
            $this->outputSuccess($output, $vendor, $name);
            
            return Command::SUCCESS;
            
        } catch (LocalizedException $e) {
            $output->writeln("<error>{$e->getMessage()}</error>");
            return Command::FAILURE;
        } catch (\Exception $e) {
            $output->writeln("<error>An unexpected error occurred: {$e->getMessage()}</error>");
            return Command::FAILURE;
        }
    }

    private function outputIntroduction(OutputInterface $output, string $vendor, string $name)
    {
        $output->writeln('<info>Creating child theme...</info>');
        $output->writeln("<info>Vendor: {$vendor}</info>");
        $output->writeln("<info>Name: {$name}</info>");
    }

    private function createThemeStructure(string $vendor, string $name, OutputInterface $output)
    {
        $this->createThemeDirectoryStructure($vendor, $name, $output);
        $this->generateThemeFiles($vendor, $name, $output);
        $this->scaffoldBuildSystem($vendor, $name, $output);
    }

    private function outputSuccess(OutputInterface $output, string $vendor, string $name)
    {
        $themePath = $this->getThemePath($vendor, $name);
        
        $output->writeln('<info>Child theme created successfully!</info>');
        $output->writeln("<comment>Theme location: {$themePath}</comment>");
        $output->writeln('<comment>Next steps:</comment>');
        $output->writeln('<comment>1. Run: bin/magento setup:upgrade</comment>');
        $output->writeln('<comment>2. Navigate to Admin > Content > Design > Themes to see your new theme</comment>');
        $output->writeln("<comment>3. Navigate to build directory: {$themePath}/web/satoshi</comment>");
        $output->writeln('<comment>4. Run: pnpm install && pnpm run build</comment>');
        $output->writeln('<comment>5. The build system will automatically detect and inherit from parent Satoshi theme</comment>');
    }

    private function getThemePath(string $vendor, string $name)
    {
        return sprintf('%s/%s/%s', self::THEME_BASE_PATH, $vendor, $name);
    }

    private function createThemeDirectoryStructure(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        
        $output->writeln("<info>Creating base theme structure at: {$themePath}</info>");
        
        if (!$this->directoryWrite->isDirectory($themePath)) {
            $this->directoryWrite->create($themePath);
        }
        
        $output->writeln('<info>Base structure created</info>');
    }

    private function generateThemeFiles(string $vendor, string $name, OutputInterface $output)
    {
        $this->generateThemeXml($vendor, $name, $output);
        $this->generateRegistrationPhp($vendor, $name, $output);
        $this->generateComposerJson($vendor, $name, $output);
    }

    private function generateThemeXml(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $themeXmlPath = "{$themePath}/theme.xml";
        
        $content = $this->getThemeXmlTemplate($name);
        $this->writeFile($themeXmlPath, $content);
        
        $output->writeln("<info>Created theme.xml at: {$themeXmlPath}</info>");
    }

    private function generateRegistrationPhp(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $registrationPath = "{$themePath}/registration.php";
        
        $content = $this->getRegistrationPhpTemplate($vendor, $name);
        $this->writeFile($registrationPath, $content);
        
        $output->writeln("<info>Created registration.php at: {$registrationPath}</info>");
    }

    private function generateComposerJson(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $composerPath = "{$themePath}/composer.json";
        
        $content = $this->getComposerJsonTemplate($vendor, $name);
        $this->writeFile($composerPath, $content);
        
        $output->writeln("<info>Created composer.json at: {$composerPath}</info>");
    }

    private function writeFile(string $path, string $content)
    {
        $this->directoryWrite->writeFile($path, $content);
    }

    private function scaffoldBuildSystem(string $vendor, string $name, OutputInterface $output)
    {
        $output->writeln('<info>Setting up build system with dynamic parent resolution...</info>');
        
        $this->copyParentWebDirectory($vendor, $name, $output);
        $this->generateBuildFiles($vendor, $name, $output);
        
        $output->writeln('<info>✅ Minimal build system scaffolded successfully!</info>');
        $output->writeln('<info>🔧 The child theme will automatically detect and inherit from parent theme</info>');
    }

    private function generateBuildFiles(string $vendor, string $name, OutputInterface $output)
    {
        $this->generateChildTailwindConfig($vendor, $name, $output);
        $this->generateChildViteConfig($vendor, $name, $output);
        $this->generateChildTailwindSource($vendor, $name, $output);
        $this->generateChildThemeCss($vendor, $name, $output);
    }

    private function copyParentWebDirectory(string $vendor, string $name, OutputInterface $output)
    {
        $output->writeln('<info>Copying specific files from parent web directory...</info>');
        
        $parentWebPath = $this->locateParentWebDirectory($output);
        if (!$parentWebPath) {
            throw new LocalizedException(
                __('Could not locate satoshi-theme web directory. Expected in %1', self::PARENT_THEME_PATH)
            );
        }
        
        $targetWebPath = $this->getThemePath($vendor, $name) . '/web';
        $this->copySpecificFiles($parentWebPath, $targetWebPath, $output);
        
        $output->writeln("<info>Copied specific files to: {$targetWebPath}</info>");
    }

    private function locateParentWebDirectory(OutputInterface $output)
    {
        if ($this->directoryWrite->isDirectory(self::PARENT_THEME_PATH)) {
            $output->writeln('<info>Found parent theme in vendor location</info>');
            return self::PARENT_THEME_PATH;
        }
        
        return null;
    }

    private function copySpecificFiles(string $source, string $destination, OutputInterface $output)
    {
        $filesToCopy = [
            'fonts', // entire directory
            'satoshi/.gitignore',
            'satoshi/.npmrc',
            'satoshi/package.json',
            'satoshi/pnpm-lock.yaml',
            'satoshi/postcss.config.js',
            'satoshi/tsconfig.json',
        ];

        foreach ($filesToCopy as $fileOrDir) {
            $this->copyFileOrDirectory($source, $destination, $fileOrDir, $output);
        }
    }

    private function copyFileOrDirectory(string $source, string $destination, string $item, OutputInterface $output)
    {
        $sourcePath = "{$source}/{$item}";
        $destPath = "{$destination}/{$item}";

        if ($this->directoryWrite->isDirectory($sourcePath)) {
            $output->writeln("<info>Copying directory: {$item}</info>");
            $this->copyDirectoryRecursively($sourcePath, $destPath, $output);
        } elseif ($this->directoryWrite->isFile($sourcePath)) {
            $output->writeln("<info>Copying file: {$item}</info>");
            $this->copyFile($sourcePath, $destPath);
        } else {
            $output->writeln("<comment>Skipping missing file/directory: {$item}</comment>");
        }
    }

    private function copyFile(string $sourcePath, string $destPath)
    {
        $destDir = dirname($destPath);
        if (!$this->directoryWrite->isDirectory($destDir)) {
            $this->directoryWrite->create($destDir);
        }
        
        $content = $this->directoryWrite->readFile($sourcePath);
        $this->directoryWrite->writeFile($destPath, $content);
    }

    private function copyDirectoryRecursively(string $source, string $destination, OutputInterface $output)
    {
        if (!$this->directoryWrite->isDirectory($destination)) {
            $this->directoryWrite->create($destination);
        }
        
        $sourceFiles = $this->directoryWrite->read($source);
        
        foreach ($sourceFiles as $file) {
            $file = str_replace($source, '', $file);
            $sourceFile = $source . $file;
            $destFile = $destination . $file;
            
            if ($this->directoryWrite->isDirectory($sourceFile)) {
                $this->copyDirectoryRecursively($sourceFile, $destFile, $output);
            } else {
                $content = $this->directoryWrite->readFile($sourceFile);
                $this->directoryWrite->writeFile($destFile, $content);
            }
        }
    }

    private function generateChildTailwindConfig(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $configPath = "{$themePath}/web/satoshi/tailwind.config.js";
        
        $content = $this->getTailwindConfigTemplate();
        $this->writeFile($configPath, $content);
        
        $output->writeln("<info>Generated child tailwind.config.js at: {$configPath}</info>");
    }

    private function generateChildViteConfig(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $configPath = "{$themePath}/web/satoshi/vite.config.js";
        
        $content = $this->getViteConfigTemplate();
        $this->writeFile($configPath, $content);
        
        $output->writeln("<info>Generated child vite.config.js at: {$configPath}</info>");
    }

    private function generateChildTailwindSource(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $sourcePath = "{$themePath}/web/satoshi/tailwind-source.css";
        
        $content = '@import "@satoshi-theme/tailwind-source.css";';
        $this->writeFile($sourcePath, $content);
        
        $output->writeln("<info>Generated child tailwind-source.css at: {$sourcePath}</info>");
    }

    private function generateChildThemeCss(string $vendor, string $name, OutputInterface $output)
    {
        $themePath = $this->getThemePath($vendor, $name);
        $cssPath = "{$themePath}/web/satoshi/theme.css";
        
        $content = '@import "@satoshi-theme/theme.css";';
        $this->writeFile($cssPath, $content);
        
        $output->writeln("<info>Generated child theme.css at: {$cssPath}</info>");
    }

    // Template methods

    private function getThemeXmlTemplate(string $name)
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

    private function getRegistrationPhpTemplate(string $vendor, string $name)
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

    private function getComposerJsonTemplate(string $vendor, string $name)
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

    private function getTailwindConfigTemplate()
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

    private function getViteConfigTemplate()
    {
        return <<<JS
import { defineConfig } from "vite";
import path from "path";
import { satoshiAliases } from "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi/vite.config";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                app: path.resolve(__dirname, "src/app.ts"),
                styles: path.resolve(__dirname, "tailwind-source.css"),
            },
            output: {
                dir: path.resolve(__dirname, "../"),
                entryFileNames: "assets/[name].js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: "css/[name].[ext]",
            },
        },
        assetsInlineLimit: 0,
        emptyOutDir: false,
    },
    resolve: {
        alias: {
            ...satoshiAliases(),
        },
    },
});
JS;
    }
}