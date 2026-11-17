const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {InjectManifest} = require('workbox-webpack-plugin');

const ScratchWebpackConfigBuilder = require('scratch-webpack-configuration');

// PUBLIC_PATH: ruta base donde se sirve el sitio en GitHub Pages.
//   - User/organization site (usuario.github.io): ''
//   - Project site (usuario.github.io/repo): '/repo/'
// Cambia la variable de entorno PUBLIC_PATH al desplegar si es necesario.
const publicPath = process.env.PUBLIC_PATH || '';

const cssModuleExceptions = [
    /\.raw\.css$/,
    /[\\/]driver\.js[\\/].*\.css$/
];

const baseConfig = new ScratchWebpackConfigBuilder({
    rootPath: path.resolve(__dirname),
    enableReact: true,
    enableTs: true,
    shouldSplitChunks: false,
    cssModuleExceptions
})
    .setTarget('browserslist')
    .merge({
        // SPARK: la PWA publicada no incluye mapas de origen.
        devtool: false,
        entry: {
            gui: path.join(__dirname, 'src/playground/index.jsx')
        },
        output: {
            assetModuleFilename: 'static/assets/[name].[hash][ext][query]',
            publicPath,
            path: path.resolve(__dirname, 'build')
        },
        resolve: {
            fallback: {
                Buffer: require.resolve('buffer/'),
                stream: require.resolve('stream-browserify')
            },
            symlinks: false
        }
    })
    .addModuleRule({
        test: /\.[cm]?jsx?$/,
        include: [
            /node_modules[\\/]@scratch[\\/]scratch-paint[\\/]src[\\/]/
        ],
        loader: 'babel-loader',
        options: {
            presets: [
                '@babel/preset-env',
                '@babel/preset-react'
            ]
        }
    })
    .addModuleRule({
        test: /\.(svg|png|wav|mp3|gif|jpg)$/,
        resourceQuery: /^$/,
        type: 'asset'
    })
    .addPlugin(new webpack.DefinePlugin({
        'process.env.DEBUG': Boolean(process.env.DEBUG),
        'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
        'process.env.GTM_ENV_AUTH': `"${process.env.GTM_ENV_AUTH || ''}"`,
        'process.env.GTM_ID': process.env.GTM_ID ? `"${process.env.GTM_ID}"` : null
    }))
    .addPlugin(new CopyWebpackPlugin({
        patterns: [
            {
                from: '../../node_modules/scratch-blocks/media',
                to: 'static/blocks-media/default'
            },
            {
                from: '../../node_modules/scratch-blocks/media',
                to: 'static/blocks-media/high-contrast'
            },
            {
                from: 'src/lib/settings/color-mode/high-contrast/blocks-media',
                to: 'static/blocks-media/high-contrast',
                force: true
            },
            {
                context: '../../node_modules/@scratch/scratch-vm/dist/web',
                from: 'extension-worker.js',
                noErrorOnMissing: true
            },
            {
                context: '../../node_modules/@scratch/scratch-storage/dist/web',
                from: 'chunks/fetch-worker.*.js',
                noErrorOnMissing: true
            },
            {
                context: '../../node_modules/@scratch/scratch-storage/dist/web',
                from: 'chunks/vendors-*.js',
                noErrorOnMissing: true
            },
            {
                from: '../../node_modules/@mediapipe/face_detection',
                to: 'chunks/mediapipe/face_detection'
            }
        ]
    }))
    .addPlugin(new CopyWebpackPlugin({
        patterns: [
            {
                from: 'src/lib/libraries/*.json',
                to: 'libraries',
                flatten: true
            },
            {
                from: 'static',
                to: 'static'
            },
            {
                from: 'extensions/**',
                to: 'static',
                context: 'src/examples'
            },
            {
                from: 'src/playground/projects.html',
                to: 'projects.html'
            },
            {
                from: path.resolve(__dirname, '../../projects'),
                to: 'projects'
            }
        ]
    }))
    .addPlugin(new HtmlWebpackPlugin({
        chunks: ['gui'],
        template: 'src/playground/index.ejs',
        title: 'Spark'
    }))
    .addPlugin(new InjectManifest({
        swSrc: path.join(__dirname, 'src/playground/service-worker.js'),
        swDest: 'sw.js',
        // SPARK: la biblioteca multimedia y los modelos de vídeo se cachean bajo demanda.
        exclude: [/\.map$/, /^manifest.*\.js$/, /^static\/library-assets\//, /^chunks\/mediapipe\//],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024
    }));

module.exports = baseConfig.get();
